import { LRUCache } from "lru-cache";
import type { CommitInfo, DiffResult, FileVersion } from "./types.js";

/**
 * Cache configuration
 */
const HISTORY_TTL = 5 * 60 * 1000; // 5 minutes
const CONTENT_TTL = 60 * 60 * 1000; // 1 hour
const MAX_ENTRIES = 500;

/**
 * LRU cache for git history queries
 * Shorter TTL since history can change frequently with new commits
 */
export const historyCache = new LRUCache<string, CommitInfo[]>({
  max: MAX_ENTRIES,
  ttl: HISTORY_TTL,
  updateAgeOnGet: true,
});

/**
 * LRU cache for file content at specific commits
 * Longer TTL since content at a commit hash is immutable
 */
export const contentCache = new LRUCache<string, FileVersion>({
  max: MAX_ENTRIES,
  ttl: CONTENT_TTL,
  updateAgeOnGet: true,
});

/**
 * LRU cache for diff results between commits
 * Longer TTL since diffs between commit hashes are immutable
 */
export const diffCache = new LRUCache<string, DiffResult>({
  max: MAX_ENTRIES,
  ttl: CONTENT_TTL,
  updateAgeOnGet: true,
});

/**
 * Generate a cache key for history queries
 */
export function historyCacheKey(identificador: string): string {
  return `history:${identificador}`;
}

/**
 * Generate a cache key for content queries
 */
export function contentCacheKey(
  identificador: string,
  commit: string,
): string {
  return `content:${identificador}:${commit}`;
}

/**
 * Generate a cache key for diff queries
 */
export function diffCacheKey(
  identificador: string,
  from: string,
  to: string,
): string {
  return `diff:${identificador}:${from}:${to}`;
}
