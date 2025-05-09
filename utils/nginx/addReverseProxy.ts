import fs from "fs";
import path from "path";
import tar from "tar-stream";
import Docker from "dockerode";
import stream from "stream";

const docker = new Docker();

type AddReverseProxyConfigFunction = (
  targetContainerName: string,
  nginxContainerName: string,
  domain: string,
  internalPort: number // Use 8484 for Grist
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
    const configFilePath = path.join(sitesAvailablePath, configFileName);

    const reverseProxyConfig = `
server {
    listen 80;
    server_name ${domain};

    location / {
        proxy_pass http://${targetContainerName}:${internalPort};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`;

    const tempFilePath = path.join(__dirname, configFileName);
    fs.writeFileSync(tempFilePath, reverseProxyConfig);

    const pack = tar.pack();
    pack.entry({ name: configFileName }, fs.readFileSync(tempFilePath));
    pack.finalize();

    await nginxContainer.putArchive(pack, { path: sitesAvailablePath });
    fs.unlinkSync(tempFilePath);

    await runExec(nginxContainer, [
      "ln",
      "-sf",
      path.join(sitesAvailablePath, configFileName),
      path.join(sitesEnabledPath, configFileName),
    ]);

    await runExec(nginxContainer, ["nginx", "-t"]);
    await runExec(nginxContainer, ["nginx", "-s", "reload"]);

    console.log("NGINX config added and reloaded successfully.");
  } catch (err) {
    console.error("Error setting up reverse proxy:", err);
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