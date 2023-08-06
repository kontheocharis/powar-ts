/**
 * A map of path key-value pairs.
 *
 * This is used for `{ src1 : [dest1,..destN], ..}` file path mappings.
 */
export type Entries = Record<string, string | string[]>;

/**
 * A map of string-key--path-value pairs.
 *
 * This is used for `{ srcText1 : [dest1,..destN], ..}` content-to-file mappings.
 */
export type Contents = [string, string | string[]][];

/**
 * Options for the `exec` function.
 */
export interface ExecOpts {
  /**
   * The standard input to pass to the command.
   */
  stdin?: string | Buffer;
  /**
   * The current working directory to run the command in.
   *
   * By default it is the directory `path` given to the current module, or
   * `rootPath` if this is in the global configuration.
   */
  cwd?: string;
}

/**
 * The output of the `exec` function.
 *
 * This is a wrapper around stdout and stderr buffers, and the exit code.
 */
export interface Output {
  /**
   * The exit code of the command.
   */
  code: number;
  /**
   * The standard output of the command as a string.
   */
  stdoutAsString: () => string;
  /**
   * The standard output of the command as a byte buffer.
   */
  stdoutAsBytes: () => Uint8Array;
  /**
   * The standard error of the command as a string.
   */
  stderrAsString: () => string;
  /**
   * The standard error of the command as a byte buffer.
   */
  stderrAsBytes: () => Uint8Array;
}

/**
 * An empty output object, used for dry runs.
 */
export const EMPTY_OUTPUT: Output = {
  code: 0,
  stdoutAsString() {
    return "";
  },
  stdoutAsBytes() {
    return new Uint8Array([]);
  },
  stderrAsString() {
    return "";
  },
  stderrAsBytes() {
    return new Uint8Array([]);
  },
};

/**
 * The main powar-ts API which is available to modules and the global
 * configuration.
 */
export interface CommonApi {
  /**
   * Log a message at the info level.
   */
  info: (msg: string) => void;
  /**
   * Log a message at the warn level.
   */
  warn: (msg: string) => void;

  /**
   * Make a directory at the given path, including any parent directories.
   */
  makeDir: (paths: string) => Promise<void>;

  /**
   * Copy files from the given source paths to the given destination paths.
   */
  install: (entries: Entries) => Promise<void>;

  /**
   * Symbolically link files from the given source paths to the given destination paths.
   */
  link: (entries: Entries) => Promise<void>;

  /**
   * Write the given contents to the given destination paths.
   */
  installContents: (contents: Contents) => Promise<void>;

  /**
   * Execute the given command in the shell.
   */
  exec: (command: string, opts?: ExecOpts) => Promise<Output>;

  /**
   * Read the contents of the given file.
   */
  read: (filename: string) => Promise<Output>;
}

/**
 * The configuration for a powar-ts module.
 */
export interface ModuleConfig {
  /**
   * The name of the module
   */
  name: string;

  /**
   * The path to the module, usually this should be `__dirname`.
   */
  path: string;

  /**
   * Other modules which this module depends upon.
   *
   * These will be checked to exist before this module is run.
   */
  dependsOn?: string[];
}

/**
 * The API available to a powar-ts module.
 */
export interface ModuleApi extends CommonApi {
  kind?: "module";
}

/**
 * The API available to the global configuration.
 */
export interface GlobalApi extends CommonApi {
  kind?: "global";
}

/**
 * A powar-ts module.
 */
export interface Module extends ModuleConfig {
  /**
   * The action to perform for this module.
   *
   * This is a function which takes the powar-ts module API and performs
   * some relevant tasks with it (installing/copying files, running commands, etc.).
   */
  action: (p: ModuleApi) => Promise<void>;
}

/**
 * The global configuration for powar-ts.
 */
export interface GlobalConfig {
  /**
   * Perform some tasks before the modules are run.
   */
  preAction?: (p: GlobalApi) => Promise<void>;
  /**
   * The root path for the powar-ts configuration, usually this should be `__dirname`.
   */
  rootPath: string;
  /**
   * The modules to run.
   */
  modules: Module[];
  /**
   * Perform some tasks after the modules are run.
   */
  postAction?: (p: GlobalApi) => Promise<void>;
}

/**
 * Make a powar-ts module.
 */
export function module<T>(m: (vars: T) => Module): (vars: T) => Module {
  return m;
}

/**
 * Produce some object `U` determined by some module variables `T` and the powar-ts module API.
 */
export function produce<T, U>(
  m: (vars: T, p: ModuleApi) => U
): (vars: T, p: ModuleApi) => U {
  return m;
}
