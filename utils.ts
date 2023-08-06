import { path } from "./deps.ts";

/**
 * Get the directory of the given `ImportMeta`.
 *
 * Use `dir(import.meta)` instead of `__dirname`.
 */
export function dir(importMeta: ImportMeta): string {
  return path.dirname(path.fromFileUrl(importMeta.url));
}
