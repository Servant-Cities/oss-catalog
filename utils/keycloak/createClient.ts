interface KeycloakClientConfig {
  domain: string;
  admin: string;
  admin_password: string;
  realm: string;
  clientId: string;
  clientSecret: string;
  clientDomain: string;
}

export const createKeycloakClient = async (config: KeycloakClientConfig) => {
  const {
    domain,
    admin,
    admin_password,
    realm,
    clientId,
    clientSecret,
    clientDomain,
  } = config;

  const keycloakUrl = `https://${domain}/admin/realms/${realm}/clients`;

  try {
    const tokenUrl = `https://${domain}/realms/master/protocol/openid-connect/token`;
    const tokenData = new URLSearchParams();
    tokenData.append("client_id", "admin-cli");
    tokenData.append("username", admin);
    tokenData.append("password", admin_password);
    tokenData.append("grant_type", "password");

    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenData,
    });

    if (!tokenResponse.ok) {
      throw new Error(
        `Failed to obtain access token: ${tokenResponse.status} ${tokenResponse.statusText}`
      );
    }

    const tokenResult = await tokenResponse.json();
    const accessToken = tokenResult.access_token;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    const clientData = {
      clientId,
      protocol: "openid-connect",
      rootUrl: `https://${clientDomain}`,
      redirectUris: [`https://${clientDomain}/oauth2/callback`],
      postLogoutRedirectUris: [`https://${clientDomain}/*`],
      standardFlowEnabled: true,
      directAccessGrantsEnabled: true,
      publicClient: false,
      secret: clientSecret,
    };

    const createClientResponse = await fetch(keycloakUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(clientData),
    });

    if (!createClientResponse.ok) {
      const errorText = await createClientResponse.text();
      throw new Error(
        `Failed to create client: ${createClientResponse.status} ${createClientResponse.statusText} - ${errorText}`
      );
    }

    const text = await createClientResponse.text();
    let createClientResult = null;
    try {
      createClientResult = text ? JSON.parse(text) : null;
    } catch (e) {
      console.warn("Create client response was not valid JSON:", text);
    }

    console.log(
      "Client created successfully:",
      createClientResult || createClientResponse.status
    );
    return createClientResult;
  } catch (error) {
    console.error("Error creating client:", error);
    throw error;
  }
};

export default createKeycloakClient;
