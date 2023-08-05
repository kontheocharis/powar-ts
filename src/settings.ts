export interface Settings {
  dryRun: boolean;
  modules: { skip: string[] } | "all" | { only: string[] };
  logLevel: "none" | "info" | "warn";
}

export const DEFAULT_SETTINGS: Settings = {
  dryRun: false,
  modules: "all",
  logLevel: "info",
};
