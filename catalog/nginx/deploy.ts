import prepareDirectories from "../../utils/nginx/prepareDirectories";
import dockerDeploy, { DockerDeployParams } from "../../utils/docker/deploy";

export const deploy = async (params: DockerDeployParams) => {
  console.log(`\n\x1b[32m------[Nginx]------\x1b[0m`)
  console.log("Deploying Nginx with the following params:");
  console.log(params);

  await dockerDeploy(params);

  await prepareDirectories(params.container_name);
};

export default deploy;
