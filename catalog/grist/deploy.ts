import addReverseProxyConfig from "../../utils/nginx/addReverseProxy";
import dockerDeploy, { DockerDeployParams } from "../../utils/docker/deploy";

export const deploy = async (
  params: DockerDeployParams & { nginx_instance: string; domain: string }
) => {
  console.log(`\n\x1b[32m------[Grist]------\x1b[0m`);
  console.log("Deploying Grist with the following params:");
  console.log(params);

  await dockerDeploy(params);

  await addReverseProxyConfig(params.container_name, params.nginx_instance, params.domain, 8484);
};

export default deploy;
