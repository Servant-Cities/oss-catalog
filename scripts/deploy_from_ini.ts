import { readFile } from "node:fs/promises";
import { parse } from "ini";
import * as catalog from "../catalog";

const main = async () => {
  console.log(catalog);
  let text = await readFile(`./active-services.ini`, {
    encoding: "utf-8",
  });

  const config = parse(text);
  console.log(catalog);

  Object.entries(config).forEach(([service, params]) => {
    catalog[service].deploy(params);
  });
};

main();
