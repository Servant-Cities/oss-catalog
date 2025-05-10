import Docker from "dockerode";

async function selfSignCert(container: Docker.Container, domain: string) {
  try {
    const certPath = `/etc/nginx/certs/${domain}.crt`;
    const keyPath = `/etc/nginx/certs/${domain}.key`;

    await runExec(container, ["mkdir", "-p", "/etc/nginx/certs"]);

    await runExec(container, [
      "openssl",
      "req",
      "-x509",
      "-nodes",
      "-days",
      "365",
      "-newkey",
      "rsa:2048",
      "-keyout",
      keyPath,
      "-out",
      certPath,
      "-subj",
      `/CN=${domain}`
    ]);

    console.log(`Self-signed certificate generated for ${domain}`);
    return { certPath, keyPath };
  } catch (err) {
    console.error(`Error generating self-signed certificate: ${err}`);
    throw err;
  }
}

async function runExec(container, cmd) {
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

export default selfSignCert;
