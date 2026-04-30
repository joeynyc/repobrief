import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { simpleGit } from "simple-git";
import type { AuditCategory, AuditFinding, AuditResult, AuditSeverity, RepoBriefContext } from "../types.js";
import { readFileSafe } from "../utils/fs.js";

const DEFAULT_THRESHOLD = 80;
const CONTEXT_FILES = ["architecture.md", "dependencies.md", "patterns.md", "hotfiles.md"];
const ROOT_EXPORT_FILES = ["AGENTS.md", "CLAUDE.md", ".cursorrules", "CODEMAP.md"];
const DIRECTIVE_PATTERN = /\b(must|always|never|do not|don't|should not|required|requires|require)\b/gi;

interface LoadedTextFile {
  path: string;
  content: string;
  lines: number;
}

export interface AuditOptions {
  threshold?: number;
  write?: boolean;
}

interface FindingInput {
  id: string;
  severity: AuditSeverity;
  category: AuditCategory;
  message: string;
  recommendation: string;
  evidence?: string;
  deduction: number;
}

function validateThreshold(threshold: number): number {
  if (!Number.isFinite(threshold) || !Number.isInteger(threshold) || threshold < 0 || threshold > 100) {
    throw new Error("Invalid audit threshold. Use an integer from 0 to 100.");
  }
  return threshold;
}

function gradeForScore(score: number): AuditResult["grade"] {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function finding(input: FindingInput): FindingInput {
  return input;
}

function lineCount(content: string): number {
  if (content.length === 0) return 0;
  return content.split(/\r?\n/).length;
}

async function loadContext(rootDir: string): Promise<RepoBriefContext> {
  const contextPath = path.join(rootDir, ".repobrief", "context.json");
  let raw: string;

  try {
    raw = await readFile(contextPath, "utf8");
  } catch {
    throw new Error("Missing .repobrief/context.json. Run `repobrief init` first.");
  }

  try {
    return JSON.parse(raw) as RepoBriefContext;
  } catch {
    throw new Error("Invalid .repobrief/context.json. Re-run `repobrief init` to regenerate it.");
  }
}

async function loadTextFiles(rootDir: string): Promise<LoadedTextFile[]> {
  const candidates = [
    ...CONTEXT_FILES.map((file) => path.join(".repobrief", file)),
    ...ROOT_EXPORT_FILES
  ];
  const files: LoadedTextFile[] = [];

  for (const relativePath of candidates) {
    const content = await readFileSafe(path.join(rootDir, relativePath));
    if (content !== null) {
      files.push({ path: relativePath, content, lines: lineCount(content) });
    }
  }

  return files;
}

async function latestGitCommitDate(rootDir: string): Promise<Date | null> {
  try {
    const git = simpleGit(rootDir);
    if (!(await git.checkIsRepo())) return null;
    const log = await git.log({ maxCount: 1 });
    const latest = log.latest?.date;
    return latest ? new Date(latest) : null;
  } catch {
    return null;
  }
}

async function auditFreshness(rootDir: string, context: RepoBriefContext): Promise<FindingInput[]> {
  const findings: FindingInput[] = [];
  const generatedAt = new Date(context.generatedAt);

  if (Number.isNaN(generatedAt.getTime())) {
    findings.push(
      finding({
        id: "freshness-invalid-generated-at",
        severity: "error",
        category: "freshness",
        message: "The context timestamp is invalid.",
        recommendation: "Run `repobrief update` to regenerate context metadata.",
        evidence: `generatedAt=${context.generatedAt}`,
        deduction: 25
      })
    );
    return findings;
  }

  const latestCommitDate = await latestGitCommitDate(rootDir);
  if (latestCommitDate && generatedAt.getTime() + 1000 < latestCommitDate.getTime()) {
    findings.push(
      finding({
        id: "freshness-stale-context",
        severity: "warning",
        category: "freshness",
        message: "Generated context is older than the latest git commit.",
        recommendation: "Run `repobrief update` after code changes so generated context reflects the current repository.",
        evidence: `context=${context.generatedAt}, latestCommit=${latestCommitDate.toISOString()}`,
        deduction: 15
      })
    );
  }

  return findings;
}

function auditBrevity(files: LoadedTextFile[]): FindingInput[] {
  const findings: FindingInput[] = [];

  for (const file of files) {
    if (file.lines > 300) {
      findings.push(
        finding({
          id: `brevity-large-${file.path}`,
          severity: "error",
          category: "brevity",
          message: `${file.path} is too long for minimal agent context.`,
          recommendation: "Reduce generated context to the smallest durable map needed for orientation and validation.",
          evidence: `${file.lines} lines`,
          deduction: 10
        })
      );
    } else if (file.lines > 150) {
      findings.push(
        finding({
          id: `brevity-warning-${file.path}`,
          severity: "warning",
          category: "brevity",
          message: `${file.path} is longer than the recommended minimal-context target.`,
          recommendation: "Prefer concise architecture, validation, and source-of-truth notes over broad narrative.",
          evidence: `${file.lines} lines`,
          deduction: 5
        })
      );
    }
  }

  return findings;
}

function auditEvidence(context: RepoBriefContext, files: LoadedTextFile[]): FindingInput[] {
  const findings: FindingInput[] = [];
  const byPath = new Map(files.map((file) => [file.path, file.content]));
  const architecture = byPath.get(path.join(".repobrief", "architecture.md")) ?? "";
  const patterns = byPath.get(path.join(".repobrief", "patterns.md")) ?? "";
  const dependencies = byPath.get(path.join(".repobrief", "dependencies.md")) ?? "";

  if (architecture && !architecture.includes("Detection Sources")) {
    findings.push(
      finding({
        id: "evidence-missing-architecture-sources",
        severity: "warning",
        category: "evidence",
        message: "Architecture context does not explain how detections were inferred.",
        recommendation: "Include concise detection/source notes so agents know which claims are heuristic.",
        deduction: 5
      })
    );
  }

  if (patterns && !patterns.includes("Detection Notes")) {
    findings.push(
      finding({
        id: "evidence-missing-pattern-sources",
        severity: "warning",
        category: "evidence",
        message: "Pattern context does not explain how conventions were inferred.",
        recommendation: "Include detection notes for naming, imports, and tooling claims.",
        deduction: 5
      })
    );
  }

  if (context.structure.detection.framework === null && /Framework:\s+\*?\*?Unknown/i.test(architecture)) {
    findings.push(
      finding({
        id: "evidence-unknown-framework",
        severity: "info",
        category: "evidence",
        message: "Framework is unknown and should remain clearly marked as unknown.",
        recommendation: "Avoid adding framework-specific rules unless detection has evidence.",
        evidence: "Framework: Unknown",
        deduction: 3
      })
    );
  }

  if (context.structure.detection.buildSystem === null && /Build system:\s+\*?\*?Unknown/i.test(architecture)) {
    findings.push(
      finding({
        id: "evidence-unknown-build-system",
        severity: "info",
        category: "evidence",
        message: "Build system is unknown and should remain clearly marked as unknown.",
        recommendation: "Avoid inventing build commands without manifest evidence.",
        evidence: "Build system: Unknown",
        deduction: 3
      })
    );
  }

  const dependencyLines = dependencies.split(/\r?\n/).filter((line) => /^- .+@/.test(line));
  const dependencyLinesWithoutSources = dependencyLines.filter((line) => !/\([^)]+\)$/.test(line));
  if (dependencyLinesWithoutSources.length > 0) {
    findings.push(
      finding({
        id: "evidence-dependency-source-missing",
        severity: "warning",
        category: "evidence",
        message: "Some dependency claims do not include their manifest source.",
        recommendation: "Keep dependency lines source-backed, such as `name@version (package.json)`.",
        evidence: `${dependencyLinesWithoutSources.length} dependency lines missing sources`,
        deduction: 5
      })
    );
  }

  return findings;
}

function auditActionability(files: LoadedTextFile[]): FindingInput[] {
  const agentFiles = files.filter((file) => ROOT_EXPORT_FILES.includes(file.path));
  const directiveCount = agentFiles.reduce((count, file) => count + (file.content.match(DIRECTIVE_PATTERN)?.length ?? 0), 0);

  if (directiveCount > 25) {
    return [
      finding({
        id: "actionability-too-prescriptive",
        severity: "error",
        category: "actionability",
        message: "Agent-facing files contain too many imperative rules.",
        recommendation: "Keep context focused on repository facts and validation commands; reserve hard rules for critical constraints.",
        evidence: `${directiveCount} directive-like terms`,
        deduction: 15
      })
    ];
  }

  if (directiveCount > 12) {
    return [
      finding({
        id: "actionability-prescriptive-warning",
        severity: "warning",
        category: "actionability",
        message: "Agent-facing files may be more prescriptive than necessary.",
        recommendation: "Trim broad instructions that do not directly improve task success.",
        evidence: `${directiveCount} directive-like terms`,
        deduction: 5
      })
    ];
  }

  return [];
}

async function auditValidation(rootDir: string, context: RepoBriefContext, files: LoadedTextFile[]): Promise<FindingInput[]> {
  const findings: FindingInput[] = [];
  const packageJsonRaw = await readFileSafe(path.join(rootDir, "package.json"));
  const packageJson = packageJsonRaw
    ? (JSON.parse(packageJsonRaw) as { scripts?: Record<string, string> })
    : null;
  const scripts = packageJson?.scripts ?? {};
  const hasConcreteScript = Boolean(scripts.test || scripts.build || scripts.lint);
  const testCommand = context.patterns.testCommand;
  const hasConcreteTestCommand = testCommand !== "run project tests";

  if (!hasConcreteScript && !hasConcreteTestCommand) {
    findings.push(
      finding({
        id: "validation-no-command",
        severity: "error",
        category: "validation",
        message: "No concrete build, test, or lint command was detected.",
        recommendation: "Add a project script or ensure RepoBrief can detect the validation command for this repository.",
        deduction: 20
      })
    );
    return findings;
  }

  if (hasConcreteTestCommand && !files.some((file) => file.content.includes(testCommand))) {
    findings.push(
      finding({
        id: "validation-test-command-not-mentioned",
        severity: "warning",
        category: "validation",
        message: "Generated context does not mention the detected test command.",
        recommendation: `Include \`${testCommand}\` in generated context so agents know how to verify changes.`,
        evidence: testCommand,
        deduction: 10
      })
    );
  }

  return findings;
}

function capDeductions(findings: FindingInput[]): number {
  const caps: Record<AuditCategory, number> = {
    freshness: 25,
    brevity: 20,
    evidence: 20,
    actionability: 15,
    validation: 20
  };
  const totals = new Map<AuditCategory, number>();

  for (const item of findings) {
    totals.set(item.category, (totals.get(item.category) ?? 0) + item.deduction);
  }

  return [...totals.entries()].reduce((sum, [category, total]) => sum + Math.min(total, caps[category]), 0);
}

function summarize(score: number, findings: AuditFinding[]): string {
  if (findings.length === 0) return "Context is concise, current, and evidence-backed.";
  const errors = findings.filter((item) => item.severity === "error").length;
  const warnings = findings.filter((item) => item.severity === "warning").length;
  return `Context scored ${score}/100 with ${errors} errors and ${warnings} warnings.`;
}

function toAuditFinding(item: FindingInput): AuditFinding {
  return {
    id: item.id,
    severity: item.severity,
    category: item.category,
    message: item.message,
    recommendation: item.recommendation,
    evidence: item.evidence
  };
}

function renderAuditMarkdown(result: AuditResult): string {
  const findings = result.findings
    .map((item) => {
      const evidence = item.evidence ? `\n  Evidence: ${item.evidence}` : "";
      return `- [${item.severity}] ${item.message}\n  Recommendation: ${item.recommendation}${evidence}`;
    })
    .join("\n");

  return `# RepoBrief Audit

- Score: **${result.score}/100**
- Grade: **${result.grade}**
- Threshold: ${result.threshold}
- Passed: ${result.passed ? "yes" : "no"}

## Summary
${result.summary}

## Findings
${findings || "- No findings."}
`;
}

export async function runAudit(rootDir: string, options: AuditOptions = {}): Promise<AuditResult> {
  const threshold = validateThreshold(options.threshold ?? DEFAULT_THRESHOLD);
  const context = await loadContext(rootDir);
  const files = await loadTextFiles(rootDir);
  const rawFindings = [
    ...(await auditFreshness(rootDir, context)),
    ...auditBrevity(files),
    ...auditEvidence(context, files),
    ...auditActionability(files),
    ...(await auditValidation(rootDir, context, files))
  ];
  const score = Math.max(0, 100 - capDeductions(rawFindings));
  const findings: AuditFinding[] = rawFindings.map(toAuditFinding);
  const result: AuditResult = {
    generatedAt: new Date().toISOString(),
    score,
    grade: gradeForScore(score),
    threshold,
    passed: score >= threshold,
    findings,
    summary: summarize(score, findings)
  };

  if (options.write !== false) {
    const repobriefDir = path.join(rootDir, ".repobrief");
    await mkdir(repobriefDir, { recursive: true });
    await Promise.all([
      writeFile(path.join(repobriefDir, "audit.json"), JSON.stringify(result, null, 2), "utf8"),
      writeFile(path.join(repobriefDir, "audit.md"), renderAuditMarkdown(result), "utf8")
    ]);
  }

  return result;
}
