import fs from "fs";
import path from "path";
import tar from "tar-stream";
import Docker from "dockerode";

const docker = new Docker();

type AddReverseProxyConfigFunction = (
  targetContainerName: string,
  nginxContainerName: string,
  domain: string,
  internalPort: number
) => Promise<void>;

const addReverseProxyConfig: AddReverseProxyConfigFunction = async (
  targetContainerName,
  nginxContainerName,
  domain,
  internalPort
) => {
  try {
    const containers = await docker.listContainers({ all: true });

    const nginxContainerInfo = containers.find(c =>
      c.Names.includes(`/${nginxContainerName}`)
    );
    if (!nginxContainerInfo) throw new Error("NGINX container not found");

    const nginxContainer = docker.getContainer(nginxContainerInfo.Id);

    const sitesAvailablePath = "/etc/nginx/sites-available/";
    const sitesEnabledPath = "/etc/nginx/sites-enabled/";
    const configFileName = `${domain}.conf`;

    // Temporary HTTP config for certbot to validate the domain
    const certbotValidationConfig = `
server {
    listen 80;
    server_name ${domain};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
}
`;

    const tempFilePath = path.join(__dirname, configFileName);
    fs.writeFileSync(tempFilePath, certbotValidationConfig);

    const pack = tar.pack();
    pack.entry({ name: configFileName }, fs.readFileSync(tempFilePath));
    pack.finalize();
    await nginxContainer.putArchive(pack, { path: sitesAvailablePath });
    fs.unlinkSync(tempFilePath);

    // Link config and reload nginx
    await runExec(nginxContainer, [
      "ln",
      "-sf",
      path.join(sitesAvailablePath, configFileName),
      path.join(sitesEnabledPath, configFileName),
    ]);

    await runExec(nginxContainer, ["nginx", "-t"]);
    await runExec(nginxContainer, ["nginx", "-s", "reload"]);

    // Run Certbot inside container
    await runExec(nginxContainer, [
      "certbot",
      "certonly",
      "--webroot",
      "-w",
      "/var/www/certbot",
      "-d",
      domain,
      "--non-interactive",
      "--agree-tos",
      "-m",
      "admin@" + domain
    ]);

    // Final HTTPS reverse proxy config
    const finalConfig = `
server {
    listen 80;
    server_name ${domain};
    return 301 https://${domain}$request_uri;
}

server {
    listen 443 ssl;
    server_name ${domain};

    ssl_certificate /etc/letsencrypt/live/${domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://${targetContainerName}:${internalPort};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`;

    fs.writeFileSync(tempFilePath, finalConfig);
    const finalPack = tar.pack();
    finalPack.entry({ name: configFileName }, fs.readFileSync(tempFilePath));
    finalPack.finalize();
    await nginxContainer.putArchive(finalPack, { path: sitesAvailablePath });
    fs.unlinkSync(tempFilePath);

    await runExec(nginxContainer, ["nginx", "-t"]);
    await runExec(nginxContainer, ["nginx", "-s", "reload"]);

    console.log("NGINX HTTPS config with Certbot SSL added and reloaded.");
  } catch (err) {
    console.error("Error setting up Certbot reverse proxy:", err);
  }
};

async function runExec(container: Docker.Container, Cmd: string[]) {
  const exec = await container.exec({
    Cmd,
    AttachStdout: true,
    AttachStderr: true,
  });

  const streamResult = await exec.start();

  await new Promise<void>((resolve, reject) => {
    streamResult.pipe(process.stdout);
    streamResult.on("end", resolve);
    streamResult.on("error", reject);
  });

  const inspect = await exec.inspect();
  if (inspect.ExitCode !== 0) {
    throw new Error(`Command "${Cmd.join(" ")}" failed with exit code ${inspect.ExitCode}`);
  }
}

export default addReverseProxyConfig;
