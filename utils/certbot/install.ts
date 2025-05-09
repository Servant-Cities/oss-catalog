import Docker from "dockerode";

const docker = new Docker();

async function runCommand(container: Docker.Container, cmd: string[]) {
  const exec = await container.exec({
    Cmd: cmd,
    AttachStdout: true,
    AttachStderr: true,
  });

  const stream = await exec.start();

  await new Promise<void>((resolve, reject) => {
    stream.pipe(process.stdout);
    stream.on("end", resolve);
    stream.on("error", reject);
  });

  const inspect = await exec.inspect();
  if (inspect.ExitCode !== 0) {
    throw new Error(`Command failed: ${cmd.join(" ")}`);
  }
}

async function installCertbot(containerName: string) {
  try {
    const container = docker.getContainer(containerName);

    console.log(`Installing certbot in container: ${containerName}`);

    await runCommand(container, ["apt-get", "update"]);
    await runCommand(container, ["apt-get", "install", "-y", "certbot", "python3-certbot-nginx", "bash"]);
    await runCommand(container, ["mkdir", "-p", "/var/www/certbot"]);

    console.log("Certbot installed successfully.");
  } catch (error) {
    console.error("Error installing certbot:", error);
    throw error;
  }
}

export default installCertbot;
