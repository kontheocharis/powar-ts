import { spawn } from "child_process";
import { ExecOpts as ExecOpts, Output } from "./api";

/**
 * Execute the given command in the shell.
 */
export async function execute(
  command: string,
  opts?: ExecOpts
): Promise<Output> {
  return new Promise((resolve, reject) => {
    // Run the command in the shell (only works on UNIX for now).
    const child = spawn("/bin/sh", ["-c", command], {
      cwd: opts?.cwd ?? process.cwd(),
      stdio: "pipe",
    });

    // Send the given stdin to the child process if it is given.
    opts?.stdin && child.stdin.write(opts.stdin);
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
