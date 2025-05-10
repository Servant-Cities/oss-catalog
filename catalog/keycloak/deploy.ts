import addReverseProxyConfig from "../../utils/nginx/addReverseProxy";
import createAndStartContainer, { DockerContainerConfig } from "../../utils/docker/createAndStartContainer";

export const deploy = async (
  params: DockerContainerConfig & {
    nginx_instance: string;
    domain: string;
    certbot_email: string;
  }
) => {
  console.log(`\n\x1b[32m------[Keycloak]------\x1b[0m`);
  console.log("Deploying Keycloak with the following params:");
  console.log(params);

  await createAndStartContainer({
    ...params,
    command: `start --hostname ${params.domain} --http-enabled true --proxy-headers xforwarded`,
  });
  await addReverseProxyConfig({
    targetContainerName: params.container_name,
    nginxContainerName: params.nginx_instance,
    domain: params.domain,
    internalPort: 8080,
    certbotEmail: params.certbot_email,
    serverConfig: `add_header Content-Security-Policy "frame-src 'self' https://${params.domain};";`
  });
};

export default deploy;
