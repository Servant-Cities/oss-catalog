import stopAndDeleteContainer from "../../utils/docker/stopAndDeleteContainer";

export const remove = async (params: {
  keycloak: {
    container_name: string;
  };
  container_name: string;
}) => {
  console.log(`\n\x1b[32m------[Keycloak]------\x1b[0m`);
  console.log("Removing a Keycloak instance using the following params:");
  console.log(params);

  await stopAndDeleteContainer(
    params.container_name || params.keycloak.container_name
  );
};

export default remove;
