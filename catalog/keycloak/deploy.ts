import addReverseProxyConfig from "../../utils/nginx/addReverseProxy";
import dockerDeploy, { DockerDeployParams } from "../../utils/docker/deploy";

export const deploy = async (
  params: DockerDeployParams & {
    nginx_instance: string;
    domain: string;
    certbot_email: string;
  }
) => {
  console.log(`\n\x1b[32m------[Keycloak]------\x1b[0m`);
  console.log("Deploying Keycloak with the following params:");
  console.log(params);

  await dockerDeploy(params);
  await addReverseProxyConfig(
    params.container_name,
    params.nginx_instance,
    params.domain,
    8080,
    params.certbot_email
  );
};

export default deploy;
