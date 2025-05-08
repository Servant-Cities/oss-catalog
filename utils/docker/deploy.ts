import Docker from "dockerode";

export interface DockerDeployParams {
  image: string;
  tag: string;
  container_name: string;
  ports: string;
  volumes?: string;
  environment?: string;
};

const docker = new Docker();

const deploy = async (params: DockerDeployParams) => {
  const { image, tag, container_name, ports, volumes, environment } = params;

  const ExposedPorts: Record<string, {}> = {};
  const PortBindings: Record<string, { HostPort: string }[]> = {};

  ports.split(",").forEach((pair) => {
    const [hostPort, containerPort] = pair.split(":");
    const portKey = `${containerPort}/tcp`;
    ExposedPorts[portKey] = {};
    PortBindings[portKey] = [{ HostPort: hostPort }];
  });

  try {
    console.log(`Pulling image ${image}:${tag}...`);
    await docker.pull(`${image}:${tag}`);

    console.log(`Creating container ${container_name}...`);
    const container = await docker.createContainer({
      Image: `${image}:${tag}`,
      name: container_name,
      ExposedPorts,
      HostConfig: {
        PortBindings,
        Binds: volumes?.split(","),
      },
      Env: environment?.split(","),
    });

    await container.start();

    console.log(`Container ${container_name} is running in detached mode.`);
  } catch (error) {
    console.error("Error deploying the container:", error);
    throw error;
  }
};

export default deploy;
