/**
 * @legalize-pe/git
 *
 * Git service for retrieving law file history, content at specific commits,
 * and diffs between versions.
 */

export { GitService } from "./git-service.js";
export type {
  CommitInfo,
  FileVersion,
  DiffResult,
  DiffHunk,
  DiffStats,
} from "./types.js";
