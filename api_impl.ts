import {
  CommonApi,
  Contents,
  EMPTY_OUTPUT,
  Entries,
  ExecOpts,
  Output,
} from "./api.ts";
import { Logger } from "./logging.ts";
import { Settings } from "./settings.ts";
import { execute } from "./execute.ts";
import { path } from "./deps.ts";

/**
 * Options to create a powar-ts API.
 */
export interface CommonApiOpts {
  log: Logger;
  path: string;
  settings: Settings;
}
/**
 * Acquire an implementation of the base powar-ts API.
 *
 * This uses the `child_process` NodeJS module to execute commands, and implements
 * the other methods using shell commands and `exec`.
 */
export function makeCommonApi({
  log,
  path: rootPath,
  settings,
}: CommonApiOpts): CommonApi {
  async function exec(command: string, opts: ExecOpts = {}): Promise<Output> {
    // Check dry run and log the command.
    if (settings.dryRun) {
      log.info(`[DRY RUN] ${command}`);
      return EMPTY_OUTPUT;
    }
    log.info(`[RUN] ${command}`);

    return await execute(command, {
      cwd: opts.cwd ?? rootPath,
      ...opts,
    });
  }

  async function makeDir(dir: string): Promise<void> {
    await exec(`mkdir -p "${dir}"`);
  }

  /**
   * Ensure that the parent directory of the given path exists, so that it can
   * be used as the target of `cp` or `ln`.
   */
  async function ensureParentExists(parent: string): Promise<void> {
    const directory = path.dirname(parent);
    await exec(`mkdir -p "${directory}"`);
  }

  async function install(opts: Entries): Promise<void> {
    return await iterateEntries(Object.entries(opts), async (src, dest) => {
      await ensureParentExists(dest);
      await exec(`cp "${src}" "${dest}"`);
    });
  }

  async function link(opts: Entries): Promise<void> {
    return await iterateEntries(Object.entries(opts), async (src, dest) => {
      await ensureParentExists(dest);
      // Ensure to fully resolve the source path, so that the link is not
      // relative.
      await exec(`ln -sf "$(realpath '${src}')" "${dest}"`);
    });
  }

  async function installContents(contents: Contents): Promise<void> {
    return await iterateEntries(contents, async (srcText, dest) => {
      await ensureParentExists(dest);
      await exec(`tee "${dest}"`, { stdin: srcText });
    });
  }

  async function read(filename: string): Promise<Output> {
    return await exec(`cat "${filename}"`);
  }

  return {
    info: log.info,
    warn: log.warn,
    makeDir,
    exec,
    install,
    installContents,
    link,
    read,
  };
}

/**
 * Helper function to iterate over entries.
 */
async function iterateEntries(
  entries: [string, string | string[]][],
  fn: (src: string, dest: string) => Promise<void>,
): Promise<void> {
  for (const [src, d] of entries) {
    const destinations = Array.isArray(d) ? d : [d];
    for (const dest of destinations) {
      await fn(src, dest);
    }
  }
}
