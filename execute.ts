import type { ExecOpts as ExecOpts, Output } from "./api.ts";

/**
 * Execute the given command in the shell.
 */
export async function execute(
  command: string,
  opts?: ExecOpts
): Promise<Output> {
  // Run the command in the shell (only works on UNIX for now).
  const child = new Deno.Command("/bin/sh", {
    args: ["-c", command],
    cwd: opts?.cwd ?? Deno.cwd(),
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
  }).spawn();

  // Send the given stdin to the child process if it is given.
  if (typeof opts?.stdin !== "undefined") {
    const result =
      typeof opts?.stdin === "string"
        ? new TextEncoder().encode(opts.stdin)
        : opts.stdin.bytes();

    const writer = child.stdin.getWriter();
    await writer.write(result);
    await writer.close();
  }

  const decoder = new TextDecoder();
  const output = await child.output();
  if (output.code != 0) {
    // If the exit code is non-zero, reject with the error from the
    // command.
    throw new Error(decoder.decode(output.stderr));
  }

  return {
    code: output.code,
    stdoutAsBytes() {
      return output.stdout;
    },
    stderrAsBytes() {
      return output.stderr;
    },
    stderrAsString() {
      return decoder.decode(output.stderr);
    },
    stdoutAsString() {
      return decoder.decode(output.stdout);
    },
  };
}
