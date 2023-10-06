import { path } from "./deps.ts";

/**
 * Get the filename of the given `ImportMeta`.
 */
export function file(importMeta: ImportMeta): string {
  return path.resolve(path.fromFileUrl(importMeta.url));
}

/**
 * Get the directory of the given `ImportMeta`.
 */
export function dir(importMeta: ImportMeta): string {
  return path.dirname(path.fromFileUrl(importMeta.url));
}
