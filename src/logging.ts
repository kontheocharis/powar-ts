import { Settings } from "./settings";

export interface Logger {
  logLevel?: "none" | "info" | "warn";
  depth: number;
  info: (msg: string) => void;
  warn: (msg: string) => void;
  fatal: (msg: string) => never;
}

export function makeLogger(
  logLevel: Logger["logLevel"] = "info",
  depth = 0
): Logger {
  const PREFIX = " ".repeat(depth * 2);
  function fatal(message: string): never {
    console.error("ERROR: " + message);
    process.exit(1);
  }

  function info(message: string): void {
    switch (logLevel) {
      case "info":
        console.error(PREFIX + message);
        break;
      case "warn":
      case "none":
        break;
    }
  }

  function warn(message: string): void {
    switch (logLevel) {
      case "info":
      case "warn":
        console.error(PREFIX + message);
        break;
      case "none":
        break;
    }
  }

  return {
    logLevel,
    depth,
    info,
    warn,
    fatal,
  };
}
