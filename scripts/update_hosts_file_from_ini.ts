import { readFile, appendFile } from "node:fs/promises";
import { parse } from "ini";

interface ServiceParams {
  domain?: string;
}

interface GlobalConfig {
  keycloak: ServiceParams;
}

interface ServiceConfig {
  [key: string]: ServiceParams;
}

interface Config {
  global: GlobalConfig;
  "active-services": ServiceConfig;
}

const updateHostsFile = async (domain: string) => {
  const hostsEntry = `127.0.0.1 ${domain}\n`;

  try {
    const hostsContent = await readFile("/etc/hosts", { encoding: "utf-8" });

    if (!hostsContent.includes(hostsEntry.trim())) {
      await appendFile("/etc/hosts", hostsEntry);
      console.log(`✅ Successfully added ${domain} to the hosts file.`);
    } else {
      console.log(`⚠️ ${domain} already exists in the hosts file.`);
    }
  } catch (error) {
    console.error(`❌ Failed to update hosts file for ${domain}:`, error);
  }
};

const main = async () => {
  const text = await readFile(`./active-services.ini`, {
    encoding: "utf-8",
  });
  const config: Config = parse(text);

  if (
    config.global.keycloak.domain &&
    config.global.keycloak.domain.includes("localhost")
  ) {
    await updateHostsFile(config.global.keycloak.domain);
  }

  for (const [service, params] of Object.entries(config["active-services"])) {
    if (params.domain && params.domain.includes("localhost")) {
      await updateHostsFile(params.domain);
    }
  }

  console.log("Hosts file update process completed.");
};

main();
