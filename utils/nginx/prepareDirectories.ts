import Docker from 'dockerode';

const docker = new Docker();

async function prepareDirectories(containerName: string) {
  try {
    const container = docker.getContainer(containerName);

    const directories = [
      '/etc/nginx/sites-available',
      '/etc/nginx/sites-enabled'
    ];

    for (const dir of directories) {
      const checkExec = await container.exec({
        Cmd: ['test', '-d', dir],
        AttachStdout: true,
        AttachStderr: true
      });

      const checkStream = await checkExec.start();

      await new Promise((resolve, reject) => {
        checkStream.on('data', () => {});
        checkStream.on('end', resolve);
        checkStream.on('error', reject);
      });

      const inspectCheck = await checkExec.inspect();
      if (inspectCheck.ExitCode !== 0) {
        console.log(`Directory ${dir} does not exist (exit code ${inspectCheck.ExitCode}), creating...`);

        const mkdirExec = await container.exec({
          Cmd: ['mkdir', '-p', dir],
          AttachStdout: true,
          AttachStderr: true
        });

        const mkdirStream = await mkdirExec.start();

        await new Promise((resolve, reject) => {
          mkdirStream.on('data', (chunk) => {
            console.log(`[mkdir output]: ${chunk.toString()}`);
          });
          mkdirStream.on('end', resolve);
          mkdirStream.on('error', reject);
        });

        const inspectMkdir = await mkdirExec.inspect();
        if (inspectMkdir.ExitCode !== 0) {
          throw new Error(`Failed to create directory ${dir} (exit code ${inspectMkdir.ExitCode})`);
        } else {
          console.log(`Directory ${dir} created successfully.`);
        }
      } else {
        console.log(`Directory ${dir} already exists.`);
      }
    }

    // Remove default.conf
    console.log("Removing /etc/nginx/conf.d/default.conf if it exists...");
    const rmExec = await container.exec({
      Cmd: ['rm', '-f', '/etc/nginx/conf.d/default.conf'],
      AttachStdout: true,
      AttachStderr: true
    });

    const rmStream = await rmExec.start();

    await new Promise((resolve, reject) => {
      rmStream.on('data', (chunk) => {
        console.log(`[rm output]: ${chunk.toString()}`);
      });
      rmStream.on('end', resolve);
      rmStream.on('error', reject);
    });

    const rmInspect = await rmExec.inspect();
    if (rmInspect.ExitCode !== 0) {
      console.warn(`Warning: Failed to remove default.conf (exit code ${rmInspect.ExitCode})`);
    } else {
      console.log("Default NGINX config removed.");
    }

    // Replace nginx.conf
    console.log("Replacing /etc/nginx/nginx.conf to load sites-enabled...");
    const nginxConfContent = `
user nginx;
worker_processes auto;

error_log /var/log/nginx/error.log notice;
pid /run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    access_log /var/log/nginx/access.log;
    sendfile on;
    keepalive_timeout 65;

    include /etc/nginx/sites-enabled/*;
}
    `.trim();

    const replaceConfExec = await container.exec({
      Cmd: [
        'sh', '-c',
        `cat > /etc/nginx/nginx.conf << 'EOF'\n${nginxConfContent}\nEOF`
      ],
      AttachStdout: true,
      AttachStderr: true
    });

    const replaceConfStream = await replaceConfExec.start();

    await new Promise((resolve, reject) => {
      replaceConfStream.on('data', (chunk) => {
        console.log(`[nginx.conf replace]: ${chunk.toString()}`);
      });
      replaceConfStream.on('end', resolve);
      replaceConfStream.on('error', reject);
    });

    const confInspect = await replaceConfExec.inspect();
    if (confInspect.ExitCode !== 0) {
      throw new Error(`Failed to replace nginx.conf (exit code ${confInspect.ExitCode})`);
    } else {
      console.log("nginx.conf replaced successfully.");
    }

    console.log("All directories prepared and nginx.conf updated.");
  } catch (error) {
    console.error('Error preparing directories:', error);
    throw error;
  }
}

export default prepareDirectories;
