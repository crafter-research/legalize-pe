#!/usr/bin/env bun
/**
 * Audit script for law files in leyes/pe/
 * Checks for quality issues across all ~1081 files
 */

import { readdir, readFile } from "fs/promises";
import { join } from "path";

const LEYES_DIR = "/Users/shiara/Documents/personal-projects/legalize-pe/leyes/pe";

const REQUIRED_FIELDS = ["titulo", "identificador", "pais", "jurisdiccion", "rango", "fechaPublicacion", "estado"];

const SPIJ_ARTIFACTS = [
  "arrow_drop_down",
  "keyboard_backspace",
  "Volver",
  "Agrupación:",
  "Usuario Libre",
  "qr_code_2",
  "download\nmail",
];

const ERROR_PATTERNS = [
  /\b404\b/,
  /No encontrado/i,
  /\bError\b/,
  /\bundefined\b/,
];

interface FileIssue {
  file: string;
  issues: string[];
}

interface AuditReport {
  totalFiles: number;
  missingFrontmatter: string[];
  emptyOrNearEmpty: FileIssue[];
  spijArtifacts: FileIssue[];
  missingRequiredFields: FileIssue[];
  placeholderOrError: FileIssue[];
  duplicateIdentifiers: Map<string, string[]>;
  nonVigente: FileIssue[];
  bodyOnlyFrontmatter: string[];
  summary: {
    missingFrontmatter: number;
    emptyOrNearEmpty: number;
    spijArtifacts: number;
    missingRequiredFields: number;
    placeholderOrError: number;
    duplicateIdentifiers: number;
    nonVigente: number;
    bodyOnlyFrontmatter: number;
    totalIssues: number;
    cleanFiles: number;
  };
}

function parseFrontmatter(content: string): { frontmatter: Record<string, string> | null; body: string } {
  if (!content.startsWith("---")) {
    return { frontmatter: null, body: content };
  }

  const endMarker = content.indexOf("\n---", 3);
  if (endMarker === -1) {
    return { frontmatter: null, body: content };
  }

  const yamlStr = content.slice(4, endMarker);
  const body = content.slice(endMarker + 4).trim();

  const frontmatter: Record<string, string> = {};
  for (const line of yamlStr.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const rawVal = line.slice(colonIdx + 1).trim();
    const val = rawVal.replace(/^["']|["']$/g, "");
    if (key) frontmatter[key] = val;
  }

  return { frontmatter, body };
}

function countContentLines(body: string): number {
  return body
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .length;
}

function hasSPIJArtifacts(content: string): string[] {
  const found: string[] = [];
  for (const artifact of SPIJ_ARTIFACTS) {
    if (content.includes(artifact)) {
      found.push(artifact);
    }
  }
  return found;
}

function hasErrorContent(body: string): string[] {
  const found: string[] = [];
  for (const pattern of ERROR_PATTERNS) {
    if (pattern.test(body)) {
      found.push(pattern.toString());
    }
  }
  return found;
}

function isBodyJustFrontmatterRepeat(frontmatter: Record<string, string>, body: string): boolean {
  if (!body) return true;
  // Check if body has very little non-frontmatter content (less than 3 meaningful lines
  // that aren't just echoing frontmatter fields)
  const contentLines = body.split("\n").filter((l) => l.trim().length > 0);
  if (contentLines.length < 3) return true;

  // Check if body is essentially just repeating title/identificador with no articles
  const hasArticles =
    /art[ií]culo\s+\d+/i.test(body) ||
    /^#{1,3}\s+art[ií]culo/im.test(body) ||
    /\bArt\.\s*\d+/i.test(body) ||
    /^##\s+/m.test(body);

  // If body has 5+ content lines, require article-like structure
  if (contentLines.length >= 5) return false;

  return !hasArticles;
}

async function auditLaws(): Promise<AuditReport> {
  const files = (await readdir(LEYES_DIR)).filter((f) => f.endsWith(".md"));
  files.sort();

  const report: AuditReport = {
    totalFiles: files.length,
    missingFrontmatter: [],
    emptyOrNearEmpty: [],
    spijArtifacts: [],
    missingRequiredFields: [],
    placeholderOrError: [],
    duplicateIdentifiers: new Map(),
    nonVigente: [],
    bodyOnlyFrontmatter: [],
    summary: {
      missingFrontmatter: 0,
      emptyOrNearEmpty: 0,
      spijArtifacts: 0,
      missingRequiredFields: 0,
      placeholderOrError: 0,
      duplicateIdentifiers: 0,
      nonVigente: 0,
      bodyOnlyFrontmatter: 0,
      totalIssues: 0,
      cleanFiles: 0,
    },
  };

  const identifierMap = new Map<string, string[]>();
  const filesWithIssues = new Set<string>();

  for (const file of files) {
    const filePath = join(LEYES_DIR, file);
    const content = await readFile(filePath, "utf-8");
    const issuesForFile: string[] = [];

    // 1. Missing frontmatter
    if (!content.startsWith("---")) {
      report.missingFrontmatter.push(file);
      filesWithIssues.add(file);
      continue; // Can't parse further without frontmatter
    }

    const { frontmatter, body } = parseFrontmatter(content);

    if (!frontmatter) {
      report.missingFrontmatter.push(file);
      filesWithIssues.add(file);
      continue;
    }

    // 2. Empty or near-empty (< 20 lines of actual content after frontmatter)
    const contentLines = countContentLines(body);
    if (contentLines < 20) {
      report.emptyOrNearEmpty.push({ file, issues: [`${contentLines} content lines`] });
      issuesForFile.push(`near-empty (${contentLines} lines)`);
      filesWithIssues.add(file);
    }

    // 3. SPIJ navigation artifacts
    const spijFound = hasSPIJArtifacts(content);
    if (spijFound.length > 0) {
      report.spijArtifacts.push({ file, issues: spijFound });
      issuesForFile.push(`SPIJ artifacts: ${spijFound.join(", ")}`);
      filesWithIssues.add(file);
    }

    // 4. Missing required frontmatter fields
    const missingFields = REQUIRED_FIELDS.filter((f) => !frontmatter[f] || frontmatter[f].trim() === "");
    if (missingFields.length > 0) {
      report.missingRequiredFields.push({ file, issues: missingFields });
      issuesForFile.push(`missing fields: ${missingFields.join(", ")}`);
      filesWithIssues.add(file);
    }

    // 5. Placeholder or error content
    const errorMatches = hasErrorContent(body);
    if (errorMatches.length > 0) {
      report.placeholderOrError.push({ file, issues: errorMatches });
      issuesForFile.push(`error patterns: ${errorMatches.join(", ")}`);
      filesWithIssues.add(file);
    }

    // Also check for empty body
    if (!body || body.trim().length === 0) {
      const existing = report.placeholderOrError.find((e) => e.file === file);
      if (!existing) {
        report.placeholderOrError.push({ file, issues: ["empty body"] });
      }
      issuesForFile.push("empty body");
      filesWithIssues.add(file);
    }

    // 6. Duplicate identifiers
    const id = frontmatter["identificador"];
    if (id) {
      if (!identifierMap.has(id)) {
        identifierMap.set(id, []);
      }
      identifierMap.get(id)!.push(file);
    }

    // 7. Non-vigente estado
    const estado = frontmatter["estado"];
    if (estado && estado !== "vigente") {
      report.nonVigente.push({ file, issues: [estado] });
      issuesForFile.push(`estado: ${estado}`);
      filesWithIssues.add(file);
    }

    // 8. Body is just frontmatter repeated or no actual legal articles
    if (frontmatter && isBodyJustFrontmatterRepeat(frontmatter, body)) {
      report.bodyOnlyFrontmatter.push(file);
      issuesForFile.push("body lacks legal article content");
      filesWithIssues.add(file);
    }
  }

  // Collect duplicates
  for (const [id, fileList] of identifierMap) {
    if (fileList.length > 1) {
      report.duplicateIdentifiers.set(id, fileList);
      for (const f of fileList) filesWithIssues.add(f);
    }
  }

  // Summary
  report.summary = {
    missingFrontmatter: report.missingFrontmatter.length,
    emptyOrNearEmpty: report.emptyOrNearEmpty.length,
    spijArtifacts: report.spijArtifacts.length,
    missingRequiredFields: report.missingRequiredFields.length,
    placeholderOrError: report.placeholderOrError.length,
    duplicateIdentifiers: report.duplicateIdentifiers.size,
    nonVigente: report.nonVigente.length,
    bodyOnlyFrontmatter: report.bodyOnlyFrontmatter.length,
    totalIssues: filesWithIssues.size,
    cleanFiles: files.length - filesWithIssues.size,
  };

  return report;
}

function printReport(report: AuditReport): void {
  console.log("=".repeat(80));
  console.log("LAW FILES AUDIT REPORT");
  console.log("=".repeat(80));
  console.log(`Total files audited: ${report.totalFiles}`);
  console.log(`Files with issues:   ${report.summary.totalIssues}`);
  console.log(`Clean files:         ${report.summary.cleanFiles}`);
  console.log("");

  // Summary table
  console.log("ISSUE SUMMARY");
  console.log("-".repeat(50));
  console.log(`1. Missing frontmatter:         ${report.summary.missingFrontmatter}`);
  console.log(`2. Empty/near-empty (<20 lines): ${report.summary.emptyOrNearEmpty}`);
  console.log(`3. SPIJ artifacts:              ${report.summary.spijArtifacts}`);
  console.log(`4. Missing required fields:     ${report.summary.missingRequiredFields}`);
  console.log(`5. Placeholder/error content:   ${report.summary.placeholderOrError}`);
  console.log(`6. Duplicate identifiers:       ${report.summary.duplicateIdentifiers} groups`);
  console.log(`7. Non-vigente estado:          ${report.summary.nonVigente}`);
  console.log(`8. Body lacks legal content:    ${report.summary.bodyOnlyFrontmatter}`);
  console.log("");

  // Section 1
  if (report.missingFrontmatter.length > 0) {
    console.log("=".repeat(80));
    console.log("1. MISSING FRONTMATTER");
    console.log("-".repeat(80));
    for (const f of report.missingFrontmatter) {
      console.log(`  - ${f}`);
    }
    console.log("");
  }

  // Section 2
  if (report.emptyOrNearEmpty.length > 0) {
    console.log("=".repeat(80));
    console.log("2. EMPTY OR NEAR-EMPTY FILES (< 20 content lines)");
    console.log("-".repeat(80));
    for (const { file, issues } of report.emptyOrNearEmpty) {
      console.log(`  - ${file} [${issues.join(", ")}]`);
    }
    console.log("");
  }

  // Section 3
  if (report.spijArtifacts.length > 0) {
    console.log("=".repeat(80));
    console.log("3. FILES WITH SPIJ NAVIGATION ARTIFACTS");
    console.log("-".repeat(80));
    for (const { file, issues } of report.spijArtifacts) {
      console.log(`  - ${file}`);
      for (const artifact of issues) {
        console.log(`      artifact: "${artifact}"`);
      }
    }
    console.log("");
  }

  // Section 4
  if (report.missingRequiredFields.length > 0) {
    console.log("=".repeat(80));
    console.log("4. MISSING REQUIRED FRONTMATTER FIELDS");
    console.log("-".repeat(80));
    for (const { file, issues } of report.missingRequiredFields) {
      console.log(`  - ${file}`);
      console.log(`      missing: ${issues.join(", ")}`);
    }
    console.log("");
  }

  // Section 5
  if (report.placeholderOrError.length > 0) {
    console.log("=".repeat(80));
    console.log("5. PLACEHOLDER OR ERROR CONTENT");
    console.log("-".repeat(80));
    for (const { file, issues } of report.placeholderOrError) {
      console.log(`  - ${file} [${issues.join(", ")}]`);
    }
    console.log("");
  }

  // Section 6
  if (report.duplicateIdentifiers.size > 0) {
    console.log("=".repeat(80));
    console.log("6. DUPLICATE IDENTIFIERS");
    console.log("-".repeat(80));
    for (const [id, files] of report.duplicateIdentifiers) {
      console.log(`  identificador: "${id}"`);
      for (const f of files) {
        console.log(`    - ${f}`);
      }
    }
    console.log("");
  }

  // Section 7
  if (report.nonVigente.length > 0) {
    console.log("=".repeat(80));
    console.log("7. FILES WITH estado != 'vigente'");
    console.log("-".repeat(80));
    for (const { file, issues } of report.nonVigente) {
      console.log(`  - ${file} [estado: ${issues.join(", ")}]`);
    }
    console.log("");
  }

  // Section 8
  if (report.bodyOnlyFrontmatter.length > 0) {
    console.log("=".repeat(80));
    console.log("8. FILES WHERE BODY LACKS LEGAL ARTICLE CONTENT");
    console.log("-".repeat(80));
    for (const f of report.bodyOnlyFrontmatter) {
      console.log(`  - ${f}`);
    }
    console.log("");
  }

  console.log("=".repeat(80));
  console.log("END OF REPORT");
  console.log("=".repeat(80));
}

const report = await auditLaws();
printReport(report);
