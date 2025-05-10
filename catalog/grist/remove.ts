import stopAndDeleteContainer from "../../utils/docker/stopAndDeleteContainer";

export const remove = async (
  params: {
    container_name: string;
  }
) => {
  console.log(`\n\x1b[32m------[Grist]------\x1b[0m`);
  console.log("Removing a Grist instance using the following params:");
  console.log(params);

  await stopAndDeleteContainer(params.container_name)
};

export default remove;
