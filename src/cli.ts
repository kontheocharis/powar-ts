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

export async function runCli(
  global: (settings: Settings) => GlobalConfig
): Promise<void> {
  const settings = await parseSettingsFromCli();
  await run(settings, global(settings));
}

function parseSettingsFromCli(): Promise<Settings> {
  const log = makeLogger();
  return new Promise((resolve, reject) => {
    const app = command({
      name: "powar-ts",
      args: {
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
      },
      handler: (args) => {
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
    cmdRun(app, process.argv.slice(2));
  });
}
