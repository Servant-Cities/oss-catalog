import addReverseProxyConfig from "../../utils/nginx/addReverseProxy";
import createAndStartContainer, {
  DockerContainerConfig,
} from "../../utils/docker/createAndStartContainer";
import createRealm from "../../utils/keycloak/createRealm";
import waitForKeycloakReady from "../../utils/keycloak/waitForReady";

interface KeycloakConfig {
  container_name?: string;
  realm?: string;
  domain?: string;
  admin?: string;
  admin_password?: string;
}

export type KeycloakDeployParams = DockerContainerConfig & {
  nginx_instance: string;
  domain: string;
  certbot_email: string;
  keycloak?: KeycloakConfig;
} & Partial<KeycloakConfig>;

export const deploy = async (params: KeycloakDeployParams) => {
  console.log(`\n\x1b[32m------[Keycloak]------\x1b[0m`);
  console.log("Deploying Keycloak with the following params:");
  console.log(params);

  const keycloakRealm = params.realm || params.keycloak?.realm;
  const keycloakContainerName = params.container_name || params.keycloak?.container_name;
  const keycloakDomain = params.domain || params.keycloak?.domain;
  const keycloakAdmin = params.admin || params.keycloak?.admin;
  const keycloakAdminPassword =
    params.admin_password || params.keycloak?.admin_password;

  const command = `start --hostname ${keycloakDomain} --http-enabled true --proxy-headers xforwarded --health-enabled true`;

  await createAndStartContainer({
    ...params,
    container_name: keycloakContainerName,
    command,
    environment: `KEYCLOAK_ADMIN=${keycloakAdmin},KEYCLOAK_ADMIN_PASSWORD=${keycloakAdminPassword}`,
  });

  await addReverseProxyConfig({
    targetContainerName: keycloakContainerName,
    nginxContainerName: params.nginx_instance,
    domain: keycloakDomain,
    internalPort: 8080,
    certbotEmail: params.certbot_email,
  });

  await waitForKeycloakReady(keycloakDomain);

  if (
    keycloakRealm &&
    keycloakDomain &&
    keycloakAdmin &&
    keycloakAdminPassword
  ) {
    try {
      await createRealm({
        domain: keycloakDomain,
        admin: keycloakAdmin,
        admin_password: keycloakAdminPassword,
        realm: keycloakRealm,
      });
      console.log("Keycloak realm created successfully.");
    } catch (error) {
      console.error("Failed to create Keycloak realm:", error);
    }
  } else {
    console.error("Missing Keycloak configuration details.");
  }
};

export default deploy;
