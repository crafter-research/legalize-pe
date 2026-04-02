import { simpleGit, type SimpleGit, type DefaultLogFields } from "simple-git";
import type { CommitInfo, DiffResult, FileVersion, DiffHunk } from "./types.js";
import {
  historyCache,
  contentCache,
  diffCache,
  historyCacheKey,
  contentCacheKey,
  diffCacheKey,
} from "./cache.js";

/**
 * Service for interacting with git repository to retrieve law file history
 */
export class GitService {
  private git: SimpleGit;
  private repoPath: string;

  constructor(repoPath: string) {
    this.repoPath = repoPath;
    this.git = simpleGit(repoPath);
  }

  /**
   * Get the file path for a law by its identificador
   */
  private getFilePath(identificador: string): string {
    return `leyes/pe/${identificador}.md`;
  }

  /**
   * Check if a law file has any git history
   */
  async hasHistory(identificador: string): Promise<boolean> {
    const filePath = this.getFilePath(identificador);
    try {
      const log = await this.git.log({ file: filePath, maxCount: 1 });
      return log.total > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the commit history for a law file
   * Uses --follow to track file renames
   */
  async getHistory(identificador: string): Promise<CommitInfo[]> {
    const cacheKey = historyCacheKey(identificador);
    const cached = historyCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const filePath = this.getFilePath(identificador);

    try {
      // Use --follow to track file renames
      const log = await this.git.log([
        "--follow",
        "--",
        filePath,
      ]);

      const commits: CommitInfo[] = await Promise.all(
        log.all.map(async (commit: DefaultLogFields) => {
          // Get the files modified in this commit
          const diffSummary = await this.git.diffSummary([
            `${commit.hash}^`,
            commit.hash,
          ]);

          return {
            sha: commit.hash,
            message: commit.message,
            // Use authorDate (real publication date) not commitDate
            authorDate: new Date(commit.date),
            files: diffSummary.files.map((f) => f.file),
          };
        }),
      );

      historyCache.set(cacheKey, commits);
      return commits;
    } catch (error) {
      throw new Error(
        `Failed to get history for ${identificador}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get the content of a law file at a specific commit
   */
  async getContentAtCommit(
    identificador: string,
    commitSha: string,
  ): Promise<FileVersion> {
    const cacheKey = contentCacheKey(identificador, commitSha);
    const cached = contentCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const filePath = this.getFilePath(identificador);

    try {
      // Get file content at the specified commit
      const content = await this.git.show([`${commitSha}:${filePath}`]);

      // Get commit info using direct git log command for specific commit
      const log = await this.git.log(["-1", commitSha]);

      if (log.all.length === 0) {
        throw new Error(`Commit ${commitSha} not found`);
      }

      const commit = log.all[0];
      if (!commit) {
        throw new Error(`Commit ${commitSha} not found`);
      }

      const diffSummary = await this.git.diffSummary([
        `${commitSha}^`,
        commitSha,
      ]);

      const result: FileVersion = {
        content,
        commit: {
          sha: commit.hash,
          message: commit.message,
          authorDate: new Date(commit.date),
          files: diffSummary.files.map((f) => f.file),
        },
      };

      contentCache.set(cacheKey, result);
      return result;
    } catch (error) {
      throw new Error(
        `Failed to get content at commit ${commitSha} for ${identificador}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Parse unified diff output into hunks
   */
  private parseDiff(diffOutput: string): DiffHunk[] {
    const hunks: DiffHunk[] = [];
    const lines = diffOutput.split("\n");

    let currentHunk: DiffHunk | null = null;

    for (const line of lines) {
      // Match hunk header: @@ -oldStart,oldLines +newStart,newLines @@
      const hunkHeaderMatch = /^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/.exec(line);

      if (hunkHeaderMatch) {
        // Save previous hunk if exists
        if (currentHunk) {
          hunks.push(currentHunk);
        }

        // Parse new hunk header
        const oldStart = Number.parseInt(hunkHeaderMatch[1] ?? "0", 10);
        const oldLines = hunkHeaderMatch[2] ? Number.parseInt(hunkHeaderMatch[2], 10) : 1;
        const newStart = Number.parseInt(hunkHeaderMatch[3] ?? "0", 10);
        const newLines = hunkHeaderMatch[4] ? Number.parseInt(hunkHeaderMatch[4], 10) : 1;

        currentHunk = {
          oldStart,
          oldLines,
          newStart,
          newLines,
          lines: [],
        };
      } else if (currentHunk && (line.startsWith("+") || line.startsWith("-") || line.startsWith(" "))) {
        // Add line to current hunk
        currentHunk.lines.push(line);
      }
    }

    // Save last hunk
    if (currentHunk) {
      hunks.push(currentHunk);
    }

    return hunks;
  }

  /**
   * Get the diff between two commits for a law file
   */
  async getDiff(
    identificador: string,
    fromCommit: string,
    toCommit: string,
  ): Promise<DiffResult> {
    const cacheKey = diffCacheKey(identificador, fromCommit, toCommit);
    const cached = diffCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const filePath = this.getFilePath(identificador);

    try {
      // Get commit info for both commits using direct git log command
      const [fromLog, toLog] = await Promise.all([
        this.git.log(["-1", fromCommit]),
        this.git.log(["-1", toCommit]),
      ]);

      if (fromLog.all.length === 0) {
        throw new Error(`From commit ${fromCommit} not found`);
      }
      if (toLog.all.length === 0) {
        throw new Error(`To commit ${toCommit} not found`);
      }

      const fromCommitData = fromLog.all[0];
      const toCommitData = toLog.all[0];

      if (!fromCommitData || !toCommitData) {
        throw new Error("Commit data not found");
      }

      // Get diff with file-specific stats
      const diffOutput = await this.git.diff([
        fromCommit,
        toCommit,
        "--",
        filePath,
      ]);

      // Get diff summary for stats
      const diffSummary = await this.git.diffSummary([
        fromCommit,
        toCommit,
        "--",
        filePath,
      ]);

      // Get files for each commit
      const [fromDiffSummary, toDiffSummary] = await Promise.all([
        this.git.diffSummary([`${fromCommit}^`, fromCommit]),
        this.git.diffSummary([`${toCommit}^`, toCommit]),
      ]);

      const result: DiffResult = {
        from: {
          sha: fromCommitData.hash,
          message: fromCommitData.message,
          authorDate: new Date(fromCommitData.date),
          files: fromDiffSummary.files.map((f) => f.file),
        },
        to: {
          sha: toCommitData.hash,
          message: toCommitData.message,
          authorDate: new Date(toCommitData.date),
          files: toDiffSummary.files.map((f) => f.file),
        },
        hunks: this.parseDiff(diffOutput),
        stats: {
          filesChanged: diffSummary.files.length,
          insertions: diffSummary.insertions,
          deletions: diffSummary.deletions,
        },
      };

      diffCache.set(cacheKey, result);
      return result;
    } catch (error) {
      throw new Error(
        `Failed to get diff from ${fromCommit} to ${toCommit} for ${identificador}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
