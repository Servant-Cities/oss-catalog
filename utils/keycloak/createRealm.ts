interface KeycloakConfig {
  domain: string;
  admin: string;
  admin_password: string;
  realm: string;
}

export const createRealm = async (config: KeycloakConfig) => {
  const { domain, admin, admin_password, realm } = config;

  const keycloakUrl = `https://${domain}/admin/realms`;

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

    const realmData = {
      realm,
      enabled: true,
    };

    const createRealmResponse = await fetch(keycloakUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(realmData),
    });

    if (!createRealmResponse.ok) {
      throw new Error(
        `Failed to create realm: ${createRealmResponse.status} ${createRealmResponse.statusText}`
      );
    }

    const text = await createRealmResponse.text();
    let createRealmResult = null;
    try {
      createRealmResult = text ? JSON.parse(text) : null;
    } catch (e) {
      console.warn("Create realm response was not valid JSON:", text);
    }

    console.log("Realm created successfully:", createRealmResult || createRealmResponse.status);
    return createRealmResult;
  } catch (error) {
    console.error("Error creating realm:", error);
    throw error;
  }
};

export default createRealm;
