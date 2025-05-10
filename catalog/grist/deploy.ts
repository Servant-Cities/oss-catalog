import addReverseProxyConfig from "../../utils/nginx/addReverseProxy";
import dockerDeploy, { DockerDeployParams } from "../../utils/docker/deploy";

export const deploy = async (
  params: DockerDeployParams & {
    nginx_instance: string;
    domain: string;
    certbot_email: string;
  }
) => {
  console.log(`\n\x1b[32m------[Grist]------\x1b[0m`);
  console.log("Deploying Grist with the following params:");
  console.log(params);

  await dockerDeploy(params);
  await addReverseProxyConfig({
    targetContainerName: params.container_name,
    nginxContainerName: params.nginx_instance,
    domain: params.domain,
    internalPort: 8484,
    certbotEmail: params.certbot_email,
  });
};

export default deploy;
