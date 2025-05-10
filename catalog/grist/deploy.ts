import addReverseProxyConfig from "../../utils/nginx/addReverseProxy";
import createAndStartContainer, { DockerContainerConfig } from "../../utils/docker/createAndStartContainer";

export const deploy = async (
  params: DockerContainerConfig & {
    nginx_instance: string;
    domain: string;
    certbot_email: string;
  }
) => {
  console.log(`\n\x1b[32m------[Grist]------\x1b[0m`);
  console.log("Deploying Grist with the following params:");
  console.log(params);

  await createAndStartContainer(params);
  await addReverseProxyConfig({
    targetContainerName: params.container_name,
    nginxContainerName: params.nginx_instance,
    domain: params.domain,
    internalPort: 8484,
    certbotEmail: params.certbot_email,
  });
};

export default deploy;
