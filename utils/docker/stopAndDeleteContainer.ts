import Docker from "dockerode";

const docker = new Docker();

const stopAndDeleteContainer = async (containerName: string) => {
  try {
    const container = docker.getContainer(containerName);

    const containerInfo = await container.inspect();
    const isRunning = containerInfo?.State?.Running;

    if (isRunning) {
      console.log(`Stopping container ${containerName}...`);
      await container.stop();
    }

    console.log(`Removing container ${containerName}...`);
    await container.remove();

    console.log(`Container ${containerName} stopped and deleted successfully.`);
  } catch (error: any) {
    if (error.statusCode === 404) {
      console.warn(`Container ${containerName} does not exist.`);
    } else {
      console.error(
        `Error stopping/deleting container ${containerName}:`,
        error
      );
      throw error;
    }
  }
};

export default stopAndDeleteContainer;
