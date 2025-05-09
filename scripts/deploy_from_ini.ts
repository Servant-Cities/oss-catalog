import { readFile } from "node:fs/promises";
import { parse } from "ini";
import * as catalog from "../catalog";

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
  let text = await readFile(`./active-services.ini`, {
    encoding: "utf-8",
  });

  const config: Config = parse(text);

  const results: [string, boolean][] = [];

  await Object.entries(config['active-services']).reduce(
    async (previousPromise, [service, params]) => {
      await previousPromise;
      try {
        await catalog[service].deploy({ ...params, ...config.global });
        results.push([service, true]);
      } catch (error) {
        results.push([service, false]);
      }
    },
    Promise.resolve()
  );

  console.log("\nDeployment Results:\n");

  for (const [service, success] of results) {
    if (success) {
      console.log(`\x1b[32m✅ ${service}\x1b[0m`);
    } else {
      console.log(`\x1b[31m❌ ${service}\x1b[0m`);
    }
  }

  process.exit(0);
};

main();
