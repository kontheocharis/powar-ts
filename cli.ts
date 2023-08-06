import { cliffy } from "./deps.ts";
import { GlobalConfig } from "./api.ts";
import { makeLogger } from "./logging.ts";
import { run } from "./run.ts";
import { DEFAULT_SETTINGS, Settings } from "./settings.ts";

/**
 * Run powar-ts on CLI mode, which parses the settings from the command line arguments.
 */
export async function runCli(
  global: GlobalConfig | ((settings: Settings) => GlobalConfig)
): Promise<void> {
  const settings = await parseSettingsFromCli();
  const config = typeof global === "function" ? global(settings) : global;
  await run(settings, config);
}

/**
 * Parse the settings from the command line arguments.
 */
async function parseSettingsFromCli(): Promise<Settings> {
  const log = makeLogger();
  const { options } = await new cliffy.Command()
    .name("powar")
    .description("A tool for managing your dot-files.")
    .option("-d, --dry-run", "Don't actually do anything.", {
      default: DEFAULT_SETTINGS.dryRun,
    })
    .option(
      "-s, --skip-modules [modules...:string]",
      "Skip the given modules.",
      { conflicts: ["only-modules"] }
    )
    .option(
      "-o, --only-modules [modules...:string]",
      "Only run the given modules."
    )
    .option("-l, --log-level <level:string>", "Set the log level.", {
      default: DEFAULT_SETTINGS.logLevel,
    })
    .parse(Deno.args);

  // Transform the CLI arguments into a Settings object.
  const modules = (() => {
    const onlyModules =
      options.onlyModules === true ? [] : options.onlyModules ?? [];
    const skipModules =
      options.skipModules === true ? [] : options.skipModules ?? [];

    if (onlyModules.length > 0) {
      return { only: onlyModules };
    }
    if (skipModules.length > 0) {
      return { skip: skipModules };
    }
    return "all";
  })();
  if (!["none", "info", "warn"].includes(options.logLevel)) {
    log.fatal(
      `Invalid log level: ${options.logLevel}. Valid levels are: none, info, warn.`
    );
  }

  return {
    dryRun: options.dryRun,
    modules,
    logLevel: options.logLevel as Settings["logLevel"],
  };
}
