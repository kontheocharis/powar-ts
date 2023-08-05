export type Entries = Record<string, string | string[]>;
export type Contents = [string, string | string[]][];

export interface ExecuteOpts {
  stdin?: string | Buffer;
  cwd?: string;
}

export interface Output {
  code: number;
  stdoutAsString: () => string;
  stdoutAsBytes: () => Uint8Array;
  stderrAsString: () => string;
  stderrAsBytes: () => Uint8Array;
}

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

export interface CommonApi {
  info: (msg: string) => void;
  warn: (msg: string) => void;

  makeDir: (paths: string) => Promise<void>;
  install: (entries: Entries) => Promise<void>;
  link: (entries: Entries) => Promise<void>;

  installContents: (contents: Contents) => Promise<void>;

  exec: (command: string, opts?: ExecuteOpts) => Promise<Output>;
  read: (filename: string) => Promise<Output>;
}

export interface ModuleConfig {
  name: string;
  path: string;
  dependsOn: string[];
}

export interface ModuleApi extends CommonApi {
  kind?: "module";
}

export interface GlobalApi extends CommonApi {
  kind?: "global";
}

export interface Module extends ModuleConfig {
  action: (p: ModuleApi) => Promise<void>;
}

export interface GlobalConfig {
  preAction?: (p: GlobalApi) => Promise<void>;
  rootPath: string;
  modules: Module[];
  postAction?: (p: GlobalApi) => Promise<void>;
}

export function module<T>(m: (vars: T) => Module): (vars: T) => Module {
  return m;
}
