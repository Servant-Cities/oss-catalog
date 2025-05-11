import { readFile } from "node:fs/promises";
import { parse } from "ini";
import * as catalog from "../catalog";

if (process.argv.includes('--locally')) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.warn('⚠️  SSL verification is disabled via --locally flag');
}

interface GlobalConfig {
  docker_group: string;
}

interface ServiceParams {
  container_name: string;
  image: string;
  tag: string;
  ports?: string;
  environment?: string;
  command?: string;
  volumes?: string;
  nginx_instance?: string;
  domain?: string;
}

interface ServiceConfig {
  [key: string]: ServiceParams;
}

interface Config {
  global: GlobalConfig;
  'active-services': ServiceConfig;
}

const main = async () => {
  const text = await readFile(`./active-services.ini`, {
    encoding: "utf-8",
  });
  const config: Config = parse(text);

  const outputLines: string[] = [];
  let encounteredFailure = false;

  for (const [service, params] of Object.entries(config['active-services'])) {
    if (encounteredFailure) {
      outputLines.push(`⚠️ Skipped ${service}`);
      continue;
    }

    try {
      await catalog[service].deploy({ ...params, ...config.global });
      outputLines.push(`✅ Successfully deployed ${service}`);
    } catch (error) {
      outputLines.push(`❌ Failed to deploy ${service}`);
      encounteredFailure = true;
    }
  }

  console.log("\nDeployment Results:\n");
  console.log(outputLines.join("\n"));

  process.exit(0);
};

main();
