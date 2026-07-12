import path from "node:path";

type WatchListener = (files: Array<string>) => void;

const watchedFiles = new Set<string>();
const listeners = new Set<WatchListener>();

function normalizeFiles(files: Iterable<string>): Array<string> {
  return [...files].map((file) => path.resolve(file));
}

export function getWatchedFiles(): Array<string> {
  return [...watchedFiles].toSorted();
}

export function isWatchedFile(file: string): boolean {
  return watchedFiles.has(path.resolve(file));
}

export function registerWatchedFiles(files: Iterable<string>): void {
  const added: Array<string> = [];
  for (const file of normalizeFiles(files)) {
    if (watchedFiles.has(file)) continue;
    watchedFiles.add(file);
    added.push(file);
  }
  if (added.length === 0) return;
  for (const listener of listeners) listener(added);
}

export function resetWatchedFiles(files: Iterable<string> = []): void {
  watchedFiles.clear();
  registerWatchedFiles(files);
}

export function subscribeToWatchedFiles(listener: WatchListener): () => void {
  listeners.add(listener);
  const current = getWatchedFiles();
  if (current.length > 0) listener(current);
  return () => listeners.delete(listener);
}
