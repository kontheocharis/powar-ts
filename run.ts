import { CommonApi, GlobalConfig, Module } from "./api.ts";
import { makeCommonApi } from "./api_impl.ts";
import { Logger, makeLogger } from "./logging.ts";
import { Settings } from "./settings.ts";

/**
 * Run powar-ts with the given settings and global configuration.
 */
export async function run(
  settings: Settings,
  config: GlobalConfig
): Promise<void> {
  const log = makeLogger(settings.logLevel, 0);
  const api = makeCommonApi({
    log,
    path: config.rootPath,
    settings,
  });
  const ctx = { settings, config, log, api };

  ensureDepsAreMet(ctx);
  log.info("All module dependencies met.");
  await performActions(ctx);
  log.info("Done.");
}

/**
 * The context object that keeps track of the current powar-ts run.
 */
interface Ctx {
  settings: Settings;
  config: GlobalConfig;
  log: Logger;
  api: CommonApi;
}

/**
 * Filter all registered modules to only those that are requested by the user.
 *
 * This request is specified through `settings.modules`.
 */
function getRequestedModules({ settings, config }: Ctx): Module[] {
  return config.modules.filter((m) => {
    if (settings.modules === "all") {
      return true;
    }
    if ("only" in settings.modules) {
      return settings.modules.only.includes(m.name);
    }
    if ("skip" in settings.modules) {
      return !settings.modules.skip.includes(m.name);
    }
  });
}

/**
 * Ensure that all dependencies of all requested modules are met.
 */
function ensureDepsAreMet(ctx: Ctx): void {
  const {
    config: { modules },
    log,
  } = ctx;
  const errors = [];
  const moduleNames = new Set(modules.map((m) => m.name));
  for (const module of getRequestedModules(ctx)) {
    const deps = module.dependsOn || [];
    for (const dependency of deps) {
      if (!moduleNames.has(dependency)) {
        errors.push(
          `Module ${module.name} depends on module ${dependency} but this module is not registered.`
        );
      }
    }
  }
  if (errors.length > 0) {
    log.fatal(errors.join("\n"));
  }
}

/**
 * Run all requested modules.
 */
async function performModuleActions(ctx: Ctx): Promise<void> {
  const { log, settings } = ctx;
  await Promise.all(
    getRequestedModules(ctx).map(async (module) => {
      log.info(`Running ${module.name}...`);
      const api = makeCommonApi({
        log: makeLogger(settings.logLevel, 1),
        path: module.path,
        settings,
      });
      await module.action(api);
    })
  );
}

/**
 * Run the pre- and post-actions for the current powar-ts run.
 */
async function performActions(ctx: Ctx): Promise<void> {
  const { api, config } = ctx;
  config.preAction && (await config.preAction(api));
  await performModuleActions(ctx);
  config.postAction && (await config.postAction(api));
}
