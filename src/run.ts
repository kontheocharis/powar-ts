import { GlobalConfig, CommonApi, Module } from "./api";
import { makeCommonApi } from "./api-impl";
import { makeLogger, Logger } from "./logging";
import { Settings } from "./settings";

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
  const moduleNames = new Set(modules.map((m) => m.name));
  for (const module of getRequestedModules(ctx)) {
    const deps = module.dependsOn || [];
    for (const dependency of deps) {
      if (!moduleNames.has(dependency)) {
        log.fatal(
          `Module ${module.name} depends on module ${dependency} but this module is not registered.`
        );
      }
    }
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
  const { api } = ctx;
  global.preAction && (await global.preAction(api));
  await performModuleActions(ctx);
  global.postAction && (await global.postAction(api));
}
