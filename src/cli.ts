import {
  command,
  flag,
  multioption,
  array,
  string,
  option,
  oneOf,
  run as cmdRun,
} from "cmd-ts";
import { GlobalConfig } from "./api";
import { makeLogger } from "./logging";
import { run } from "./run";
import { DEFAULT_SETTINGS, Settings } from "./settings";

/**
 * Run powar-ts on CLI mode, which parses the settings from the command line arguments.
 */
export async function runCli(
  global: (settings: Settings) => GlobalConfig
): Promise<void> {
  const settings = await parseSettingsFromCli();
  await run(settings, global(settings));
}

// CLI definition:
const CLI_NAME = "powar-ts";
const CLI_DESCRIPTION = "A tool for managing your TypeScript project.";
const CLI_ARGS = {
  dryRun: flag({
    long: "dry-run",
    defaultValue: () => DEFAULT_SETTINGS.dryRun,
    description: "Don't actually do anything.",
  }),
  skipModules: multioption({
    long: "skip-module",
    description: "Skip the given modules.",
    defaultValue: () => [],
    type: array(string),
  }),
  onlyModules: multioption({
    long: "only-module",
    description: "Only run the given modules.",
    defaultValue: () => [],
    type: array(string),
  }),
  logLevel: option({
    long: "log-level",
    description: "Set the log level.",
    defaultValue: () => DEFAULT_SETTINGS.logLevel,
    type: oneOf(["none", "info", "warn"]),
  }),
} as const;

/**
 * Parse the settings from the command line arguments.
 */
function parseSettingsFromCli(): Promise<Settings> {
  const log = makeLogger();
  return new Promise((resolve, reject) => {
    const app = command({
      name: CLI_NAME,
      description: CLI_DESCRIPTION,
      args: CLI_ARGS,
      handler: (args) => {
        // Transform the CLI arguments into a Settings object.
        const modules = (() => {
          if (args.onlyModules.length > 0 && args.skipModules.length > 0) {
            log.fatal("Cannot specify both --only-modules and --skip-modules.");
          }
          if (args.onlyModules.length > 0) {
            return { only: args.onlyModules };
          }
          if (args.skipModules.length > 0) {
            return { skip: args.skipModules };
          }
          return "all";
        })();

        resolve({
          dryRun: args.dryRun,
          modules,
          logLevel: args.logLevel as "none" | "info" | "warn",
        });
      },
    });
    cmdRun(app, process.argv.slice(2)).catch(reject);
  });
}
