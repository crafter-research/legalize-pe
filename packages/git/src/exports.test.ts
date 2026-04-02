import { describe, it, expect } from "vitest";
import { GitService } from "./index.js";
import type {
  CommitInfo,
  FileVersion,
  DiffResult,
  DiffHunk,
  DiffStats,
} from "./index.js";

describe("Package Exports", () => {
  it("should export GitService class", () => {
    expect(GitService).toBeDefined();
    expect(typeof GitService).toBe("function");
  });

  it("should have correct TypeScript types", () => {
    // This test just verifies that types are importable
    const commitInfo: CommitInfo = {
      sha: "abc123",
      message: "test",
      authorDate: new Date(),
      files: [],
    };
    expect(commitInfo).toBeDefined();

    const fileVersion: FileVersion = {
      content: "test content",
      commit: commitInfo,
    };
    expect(fileVersion).toBeDefined();

    const diffHunk: DiffHunk = {
      oldStart: 1,
      oldLines: 1,
      newStart: 1,
      newLines: 1,
      lines: [],
    };
    expect(diffHunk).toBeDefined();

    const diffStats: DiffStats = {
      filesChanged: 1,
      insertions: 1,
      deletions: 1,
    };
    expect(diffStats).toBeDefined();

    const diffResult: DiffResult = {
      from: commitInfo,
      to: commitInfo,
      hunks: [diffHunk],
      stats: diffStats,
    };
    expect(diffResult).toBeDefined();
  });
});
