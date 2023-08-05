import {
  CommonApi,
  Contents,
  EMPTY_OUTPUT,
  Entries,
  ExecuteOpts,
  Output,
} from "./api";
import { Logger, makeLogger } from "./logging";
import { spawn } from "child_process";
import { dirname } from "path";
import { Settings } from "./settings";

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
  path,
  settings,
}: CommonApiOpts): CommonApi {
  async function exec(
    command: string,
    opts: ExecuteOpts = {}
  ): Promise<Output> {
    // Check dry run and log the command.
    if (settings.dryRun) {
      log.info(`[DRY RUN] ${command}`);
      return EMPTY_OUTPUT;
    }
    log.info(`[RUN] ${command}`);

    return new Promise((resolve, reject) => {
      // Run the command in the shell (only works on UNIX for now).
      const child = spawn("/bin/sh", ["-c", command], {
        cwd: opts.cwd ?? path,
        stdio: "pipe",
      });

      // Send the given stdin to the child process if it is given.
      opts.stdin && child.stdin.write(opts.stdin);
      child.stdin.end();

      // Accumulate stdout and stderr.
      let stdout: Buffer = Buffer.from([]);
      let stderr: Buffer = Buffer.from([]);
      child.stdout.on("data", (data) => {
        stdout = Buffer.concat([stdout, data]);
      });
      child.stderr.on("data", (data) => {
        stderr = Buffer.concat([stderr, data]);
      });

      // Handle errors.
      child.on("error", (error) => reject(error));

      // Once the child exits, resolve with the accumulated
      // stdout and stderr.
      child.on("close", (code) => {
        if (code != 0) {
          // If the exit code is non-zero, reject with the error from the
          // command.
          return reject(new Error(stderr.toString("utf-8")));
        }
        resolve({
          code,
          stdoutAsBytes() {
            return stdout;
          },
          stderrAsBytes() {
            return stderr;
          },
          stderrAsString() {
            return stderr.toString("utf-8");
          },
          stdoutAsString() {
            return stdout.toString("utf-8");
          },
        });
      });
    });
  }

  async function makeDir(path: string): Promise<void> {
    await exec(`mkdir -p "${path}"`);
  }

  /**
   * Ensure that the parent directory of the given path exists, so that it can
   * be used as the target of `cp` or `ln`.
   */
  async function ensureParentExists(path: string): Promise<void> {
    const directory = dirname(path);
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
  fn: (src: string, dest: string) => Promise<void>
): Promise<void> {
  for (const [src, d] of entries) {
    const destinations = Array.isArray(d) ? d : [d];
    for (const dest of destinations) {
      await fn(src, dest);
    }
  }
}
