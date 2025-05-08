import { readFile } from "node:fs/promises";
import { parse } from "ini";
import * as catalog from "../catalog";

const main = async () => {
  let text = await readFile(`./active-services.ini`, {
    encoding: "utf-8",
  });

  const config = parse(text);

  const results: [string, boolean][] = [];

  await Object.entries(config).reduce(
    async (previousPromise, [service, params]) => {
      await previousPromise;
      try {
        await catalog[service].deploy(params);
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
