#!/usr/bin/env node
import { command, option, run, string } from "cmd-ts";
import { execute } from "./execute";
import { join } from "path";
import { makeLogger } from "./logging";

// CLI definition for powar-init, a simple tool to create a new powar-ts project.
const CLI_NAME = "powar-ts-init";
const CLI_DESCRIPTION = "A tool for creating powar-ts projects.";
const CLI_ARGS = {
  name: option({
    long: "name",
    description: "The name of the project.",
    type: string,
  }),
  author: option({
    long: "author",
    description: "The author of the project.",
    type: string,
  }),
  path: option({
    long: "path",
    description: "The path to initialise the project in.",
    type: string,
  }),
} as const;

export async function init() {
  const app = command({
    name: CLI_NAME,
    description: CLI_DESCRIPTION,
    args: CLI_ARGS,
    handler: async (args) => {
      const log = makeLogger();

      // Copy the example folder to the given path.
      const exampleFolder = join(__dirname, "..", "example/");
      await execute(`cp -r ${exampleFolder} ${args.path}`);

      // Replace the placeholders in package.json with the given arguments.
      const packageJson = join(args.path, "package.json");
      await execute(
        `sed -i '' 's/<<NAME>>/${args.name}/g; s/<<AUTHOR>>/${args.author}/g' "${packageJson}"`
      );

      // Install dependencies.
      await execute(`yarn install`, { cwd: args.path });

      // Done
      log.info(
        `Created a new powar-ts project in ${args.path}! To get started, run \`cd ${args.path}; yarn powar\`.`
      );
    },
  });
  run(app, process.argv.slice(2));
}

init();
