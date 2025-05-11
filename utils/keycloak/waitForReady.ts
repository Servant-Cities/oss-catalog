const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isKeycloakReady = async (url: string): Promise<{ ok: boolean; error?: unknown }> => {
  try {
    const res = await fetch(url);
    return { ok: res.ok };
  } catch (error) {
    return { ok: false, error };
  }
};

const waitForKeycloakReady = async (domain: string, timeoutMs = 60000) => {
  const start = Date.now();
  const url = `https://${domain}/health/ready`;

  console.log(
    `Waiting for Keycloak to become ready at ${url} (timeout: ${
      timeoutMs / 1000
    }s)...`
  );

  let lastError: unknown = null;

  while (Date.now() - start < timeoutMs) {
    const { ok, error } = await isKeycloakReady(url);
    if (ok) {
      return;
    }
    if (error) {
      lastError = error;
    }
    await delay(3000);
  }

  const { ok: finalOk, error: finalError } = await isKeycloakReady(url);
  if (finalOk) {
    return;
  }
  if (finalError) {
    lastError = finalError;
  }

  console.error(
    `Keycloak at ${url} did not become ready within ${timeoutMs / 1000} seconds.`
  );
  if (lastError) {
    console.warn("Last encountered error:", lastError);
  }

  throw new Error(`Keycloak not ready after ${timeoutMs / 1000} seconds`);
};

export default waitForKeycloakReady;
