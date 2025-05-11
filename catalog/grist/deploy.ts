import addReverseProxyConfig from "../../utils/nginx/addReverseProxy";
import createAndStartContainer, {
  DockerContainerConfig,
} from "../../utils/docker/createAndStartContainer";
import createKeycloakClient from "../../utils/keycloak/createClient";

interface KeycloakConfig {
  realm: string;
  domain: string;
  admin: string;
  admin_password: string;
  container_name: string;
}

interface GristDeployParams extends DockerContainerConfig {
  nginx_instance: string;
  certbot_email: string;
  keycloak: KeycloakConfig;
  domain: string;
  environment: string;
  keycloak_client_ID?: string;
  keycloak_client_secret?: string;
}

export const deploy = async (params: GristDeployParams) => {
  console.log(`\n\x1b[32m------[Grist]------\x1b[0m`);
  console.log("Deploying Grist with the following params:");
  console.log(params);

  const isLocally = process.argv.includes("--locally");

  const keycloakHost = isLocally
    ? params.keycloak.container_name
    : params.keycloak.domain;

  const keycloakIssuer = isLocally
    ? `http://${keycloakHost}:8080/realms/${params.keycloak.realm}`
    : `https://${keycloakHost}/realms/${params.keycloak.realm}`;

  const gristHost = `https://${params.domain}`;

  try {
    await createKeycloakClient({
      domain: params.keycloak.domain,
      admin: params.keycloak.admin,
      admin_password: params.keycloak.admin_password,
      realm: params.keycloak.realm,
      clientId: params.keycloak_client_ID,
      clientSecret: params.keycloak_client_secret,
      clientDomain: params.domain,
    });
    console.log("✅ Keycloak client created successfully.");
  } catch (error) {
    console.error("❌ Failed to create Keycloak client:", error);
  }

  const environment = [
    params.environment,
    `GRIST_OIDC_SP_HOST=${gristHost}`,
    `GRIST_OIDC_IDP_ISSUER=${keycloakIssuer}`,
    `GRIST_OIDC_IDP_SCOPES=openid profile email`,
    `GRIST_OIDC_IDP_CLIENT_ID=${params.keycloak_client_ID}`,
    `GRIST_OIDC_IDP_CLIENT_SECRET=${params.keycloak_client_secret}`,
    `GRIST_SERVE_PORT=8484`,
  ].join(",");

  await createAndStartContainer({ ...params, environment });

  await addReverseProxyConfig({
    targetContainerName: params.container_name,
    nginxContainerName: params.nginx_instance,
    domain: params.domain,
    internalPort: 8484,
    certbotEmail: params.certbot_email,
  });
};

export default deploy;
