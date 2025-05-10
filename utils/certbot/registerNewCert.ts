import Docker from "dockerode";

async function registerNewCert(container: Docker.Container, domain: string, certbotEmail: string) {
  try {
    await runExec(container, [
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
      certbotEmail,
      "--force-renewal"
    ]);

    const certPath = `/etc/letsencrypt/live/${domain}/fullchain.pem`;
    const keyPath = `/etc/letsencrypt/live/${domain}/privkey.pem`;

    console.log(`Certbot executed successfully for ${domain}`);
    return { certPath, keyPath };
  } catch (err) {
    console.error(`Error running Certbot: ${err}`);
    throw err;
  }
}

async function runExec(container: Docker.Container, cmd: string[]) {
  const exec = await container.exec({
    Cmd: cmd,
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
    throw new Error(`Command "${cmd.join(" ")}" failed with exit code ${inspect.ExitCode}`);
  }
}

export default registerNewCert;
