/**
 * Logging utilities.
 */
export interface Logger {
  /**
   * The maximum log level to print.
   */
  logLevel?: "none" | "info" | "warn";
  /**
   * The indentation depth of this logger.
   */
  depth: number;

  /**
   * Log a message at the info level.
   */
  info: (msg: string) => void;

  /**
   * Log a message at the warn level.
   */
  warn: (msg: string) => void;

  /**
   * Log a message at the fatal level and exit the process.
   */
  fatal: (msg: string) => never;
}

/**
 * Make a logger with the given log level and indentation depth.
 *
 * The `info`, `warn`, and `fatal` methods will print messages to stderr.
 */
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
