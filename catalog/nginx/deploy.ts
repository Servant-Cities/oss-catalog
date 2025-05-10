import createAndStartContainer, { DockerContainerConfig } from "../../utils/docker/createAndStartContainer";
import installCertbot from "../../utils/certbot/install";
import prepareDirectories from "../../utils/nginx/prepareDirectories";

export const deploy = async (params: DockerContainerConfig) => {
  console.log(`\n\x1b[32m------[Nginx]------\x1b[0m`);
  console.log("Deploying Nginx with the following params:");
  console.log(params);

  await createAndStartContainer(params);
  await installCertbot(params.container_name);
  await prepareDirectories(params.container_name);
};

export default deploy;
