import Docker from 'dockerode';

const docker = new Docker();

export const deploy = async (params: {
  image: string;
  tag: string;
  container_name: string;
  ports: string;
  volumes: string;
  environment: string;
}) => {
  console.log("Deploying Grist with the following params:");
  console.log(params);

  const { image, tag, container_name, ports, volumes, environment } = params;

  const [hostPort, containerPort] = ports.split(':');

  try {
    console.log(`Pulling image ${image}:${tag}...`);
    await docker.pull(`${image}:${tag}`);

    console.log(`Creating container ${container_name}...`);
    const container = await docker.createContainer({
      Image: `${image}:${tag}`,
      name: container_name,
      ExposedPorts: {
        [`${containerPort}/tcp`]: {}
      },
      HostConfig: {
        PortBindings: {
          [`${containerPort}/tcp`]: [{ HostPort: hostPort }]
        },
        Binds: volumes.split(',')
      },
      Env: environment.split(',')
    });
    await container.start();

    console.log(`Container ${container_name} is running in detached mode.`);
  } catch (error) {
    console.error('Error deploying Grist:', error);
  }
};

export default deploy;
