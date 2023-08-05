import { GlobalConfig, CommonApi, Module } from "./api";
import { makeCommonApi } from "./api-impl";
import { makeLogger, Logger } from "./logging";
import { Settings } from "./settings";

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

interface Ctx {
  settings: Settings;
  config: GlobalConfig;
  log: Logger;
  api: CommonApi;
}

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

function ensureDepsAreMet(ctx: Ctx): void {
  const {
    config: { modules },
    log,
  } = ctx;
  const moduleNames = new Set(modules.map((m) => m.name));
  for (const module of getRequestedModules(ctx)) {
    for (const dependency of module.dependsOn) {
      if (!moduleNames.has(dependency)) {
        log.fatal(
          `Module ${module.name} depends on module ${dependency} but this module is not registered.`
        );
      }
    }
  }
}

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

async function performActions(ctx: Ctx): Promise<void> {
  const { api } = ctx;
  global.preAction && (await global.preAction(api));
  await performModuleActions(ctx);
  global.postAction && (await global.postAction(api));
}
