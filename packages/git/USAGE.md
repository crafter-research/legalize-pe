# @legalize-pe/git

Git service for retrieving law file history, content at specific commits, and diffs between versions.

## Installation

This package is part of the Legalize PE monorepo and is available as a workspace package:

```json
{
  "dependencies": {
    "@legalize-pe/git": "workspace:*"
  }
}
```

## Usage

### Initialize GitService

```typescript
import { GitService } from "@legalize-pe/git";

const repoPath = "/path/to/legalize-pe";
const gitService = new GitService(repoPath);
```

### Check if a law has git history

```typescript
const hasHistory = await gitService.hasHistory("dleg-295");
console.log(hasHistory); // true or false
```

### Get commit history for a law

```typescript
const history = await gitService.getHistory("dleg-295");
console.log(history);
// [
//   {
//     sha: "abc123...",
//     message: "feat: add Código Civil",
//     authorDate: Date,
//     files: ["leyes/dleg-295/ley.md"]
//   },
//   ...
// ]
```

### Get content at a specific commit

```typescript
const version = await gitService.getContentAtCommit("dleg-295", "abc123...");
console.log(version.content); // Markdown content
console.log(version.commit); // Commit info
```

### Get diff between two commits

```typescript
const diff = await gitService.getDiff("dleg-295", "abc123...", "def456...");
console.log(diff.from); // CommitInfo for source
console.log(diff.to); // CommitInfo for target
console.log(diff.hunks); // Array of DiffHunk
console.log(diff.stats); // { filesChanged, insertions, deletions }
```

## API Reference

### Types

#### CommitInfo
```typescript
interface CommitInfo {
  sha: string;
  message: string;
  authorDate: Date;
  files: string[];
}
```

#### FileVersion
```typescript
interface FileVersion {
  content: string;
  commit: CommitInfo;
}
```

#### DiffHunk
```typescript
interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: string[];
}
```

#### DiffStats
```typescript
interface DiffStats {
  filesChanged: number;
  insertions: number;
  deletions: number;
}
```

#### DiffResult
```typescript
interface DiffResult {
  from: CommitInfo;
  to: CommitInfo;
  hunks: DiffHunk[];
  stats: DiffStats;
}
```

## Caching

The package implements LRU caching with different TTLs:
- History queries: 5 minutes (can change with new commits)
- Content and diffs: 1 hour (immutable for specific commit hashes)

Maximum 500 entries cached per cache type.

## Implementation Details

- File path pattern: `leyes/${identificador}/ley.md`
- Uses `--follow` flag to track file renames
- Uses `authorDate` (real publication date) not `commitDate`
- Parses unified diff format for hunks
