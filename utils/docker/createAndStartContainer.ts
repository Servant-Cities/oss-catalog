import Docker from "dockerode";

export interface DockerContainerConfig {
  image: string;
  tag: string;
  container_name: string;
  ports?: string;
  volumes?: string;
  environment?: string;
  command?: string;
  docker_group?: string;
}

const docker = new Docker();
const NETWORK_NAME = "reverse_proxy";

const isLocally = process.argv.includes("--locally");

const ensureNetwork = async () => {
  const networks = await docker.listNetworks();
  const exists = networks.some(n => n.Name === NETWORK_NAME);

  if (!exists) {
    console.log(`Creating network ${NETWORK_NAME}...`);
    await docker.createNetwork({ Name: NETWORK_NAME });
  }
};

const createAndStartContainer = async (params: DockerContainerConfig) => {
  const {
    image,
    tag,
    container_name,
    ports,
    volumes,
    environment,
    command,
    docker_group,
  } = params;

  const ExposedPorts: Record<string, {}> = {};
  const PortBindings: Record<string, { HostPort: string }[]> = {};

  if (ports) {
    ports.split(",").forEach(pair => {
      const [hostPort, containerPort] = pair.split(":");
      const portKey = `${containerPort}/tcp`;
      ExposedPorts[portKey] = {};
      PortBindings[portKey] = [{ HostPort: hostPort }];
    });
  }

  try {
    await ensureNetwork();

    console.log(`Pulling image ${image}:${tag}...`);
    await new Promise((resolve, reject) => {
      docker.pull(`${image}:${tag}`, (err, stream) => {
        if (err) return reject(err);
        docker.modem.followProgress(stream, err =>
          err ? reject(err) : resolve(null)
        );
      });
    });

    console.log(`Creating container ${container_name}...`);
    const container = await docker.createContainer({
      Image: `${image}:${tag}`,
      name: container_name,
      ExposedPorts,
      Cmd: command ? command.split(" ") : undefined,
      HostConfig: {
        PortBindings,
        Binds: volumes?.split(","),
      },
      Env: environment?.split(","),
      Labels: docker_group
        ? { "com.docker.compose.project": docker_group }
        : {},
    });

    await container.start();
    console.log(`Container ${container_name} is running in detached mode.`);

    const network = docker.getNetwork(NETWORK_NAME);

    await network.connect({ Container: container.id });
    console.log(
      `Connected ${container_name} to ${NETWORK_NAME} network for local setup.`
    );
  } catch (error) {
    console.error("Error deploying the container:", error);
    throw error;
  }
};

export default createAndStartContainer;
