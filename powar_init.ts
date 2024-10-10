import { cliffy } from "./deps.ts";
import { execute } from "./execute.ts";
import { makeLogger } from "./logging.ts";
import { dir } from "./utils.ts";
import { path } from "./deps.ts";

/** CLI for powar-init, a simple tool to create a new powar-ts project. */
async function init() {
  await new cliffy.Command()
    .name("powar_init")
    .description("A tool for creating powar-ts projects.")
    .option(
      "-p, --path <path:string>",
      "The path to initialise the project in.",
      { required: true }
    )
    .action(async (args: { path: string; }) => {
      const log = makeLogger();

      // Copy the example folder to the given path.
      const exampleFolder = path.join(dir(import.meta), "example/");
      await execute(`cp -r ${exampleFolder} ${args.path}`);

      // Done
      log.info(
        `Created a new powar-ts project in ${args.path}! To get started, run \`cd ${args.path}; deno run global.ts\`.`
      );
    })
    .parse(Deno.args);
}

init();
