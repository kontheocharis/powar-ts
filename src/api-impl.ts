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

interface CommonApiOpts {
  log: Logger;
  path: string;
  settings: Settings;
}

export function makeCommonApi({
  log,
  path,
  settings,
}: CommonApiOpts): CommonApi {
  async function exec(
    command: string,
    opts: ExecuteOpts = {}
  ): Promise<Output> {
    if (settings.dryRun) {
      log.info(`[DRY RUN] ${command}`);
      return EMPTY_OUTPUT;
    }
    log.info(`[RUN] ${command}`);

    return new Promise((resolve, reject) => {
      const child = spawn("/bin/sh", ["-c", command], {
        cwd: opts.cwd ?? path,
        stdio: "pipe",
      });
      opts.stdin && child.stdin.write(opts.stdin);
      child.stdin.end();

      let stdout: Buffer = Buffer.from([]);
      let stderr: Buffer = Buffer.from([]);
      child.stdout.on("data", (data) => {
        stdout = Buffer.concat([stdout, data]);
      });
      child.stderr.on("data", (data) => {
        stderr = Buffer.concat([stderr, data]);
      });

      child.on("error", (error) => reject(error));

      child.on("close", (code) => {
        if (code != 0) {
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

  async function ensureParentExists(path: string): Promise<void> {
    const directory = dirname(path);
    await exec(`mkdir -p "${directory}"`);
  }

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

  async function install(opts: Entries): Promise<void> {
    return await iterateEntries(Object.entries(opts), async (src, dest) => {
      await ensureParentExists(dest);
      await exec(`cp "${src}" "${dest}"`);
    });
  }

  async function link(opts: Entries): Promise<void> {
    return await iterateEntries(Object.entries(opts), async (src, dest) => {
      await ensureParentExists(dest);
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

  const childLog = makeLogger(log.logLevel, log.depth + 1);

  return {
    info: childLog.info,
    warn: childLog.warn,
    makeDir,
    exec,
    install,
    installContents,
    link,
    read,
  };
}
