/**
 * Information about a single commit
 */
export interface CommitInfo {
  /** SHA hash of the commit */
  sha: string;
  /** Commit message */
  message: string;
  /** Author date (real publication date, not commit date) */
  authorDate: Date;
  /** List of files modified in this commit */
  files: string[];
}

/**
 * File content at a specific commit
 */
export interface FileVersion {
  /** File content at this version */
  content: string;
  /** Commit information */
  commit: CommitInfo;
}

/**
 * A single hunk in a diff
 */
export interface DiffHunk {
  /** Old file start line number */
  oldStart: number;
  /** Old file line count */
  oldLines: number;
  /** New file start line number */
  newStart: number;
  /** New file line count */
  newLines: number;
  /** Lines in the hunk (with +/- prefix) */
  lines: string[];
}

/**
 * Statistics about changes in a diff
 */
export interface DiffStats {
  /** Number of files changed */
  filesChanged: number;
  /** Number of lines added */
  insertions: number;
  /** Number of lines deleted */
  deletions: number;
}

/**
 * Result of comparing two versions
 */
export interface DiffResult {
  /** Source commit info */
  from: CommitInfo;
  /** Target commit info */
  to: CommitInfo;
  /** List of hunks showing changes */
  hunks: DiffHunk[];
  /** Statistics about the changes */
  stats: DiffStats;
}
