/**
 * General settings for powar-ts.
 *
 * These settings are commonly parsed from the command line by the help of `cli.ts`.
 */
export interface Settings {
  dryRun: boolean;
  modules: { skip: string[] } | "all" | { only: string[] };
  logLevel: "none" | "info" | "warn";
}

/**
 * The default settings for powar-ts.
 */
export const DEFAULT_SETTINGS: Settings = {
  dryRun: false,
  modules: "all",
  logLevel: "info",
};
