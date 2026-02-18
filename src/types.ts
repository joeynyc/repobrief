export interface FileStatSummary {
  exists: boolean;
  size: number;
  modifiedAt: string | null;
}

export interface ProjectDetection {
  languages: string[];
  framework: string | null;
  buildSystem: string | null;
  entryPoints: string[];
}

export interface AnalysisResult<T = unknown> {
  name: string;
  data: T;
  summary: string;
}

export interface Analyzer<T = unknown> {
  readonly name: string;
  analyze(rootDir: string): Promise<AnalysisResult<T>>;
}

export interface DependencyItem {
  name: string;
  version: string;
  type: "runtime" | "dev";
  source: string;
}

export interface GitHotFile {
  path: string;
  commits: number;
}

export interface GitContributor {
  name: string;
  email: string;
  commits: number;
}

export interface GitHistoryData {
  hotFiles: GitHotFile[];
  recentCommits: Array<{ hash: string; date: string; message: string; author: string }>;
  contributors: GitContributor[];
  totalCommits: number;
}

export interface StructureData {
  projectType: "single" | "monorepo";
  keyDirectories: string[];
  entryPoints: string[];
  detection: ProjectDetection;
}

export interface PatternsData {
  namingConvention: "camelCase" | "snake_case" | "kebab-case" | "mixed";
  importStyle: "esm" | "commonjs" | "mixed" | "unknown";
  errorHandling: string[];
  testingFramework: string | null;
  testCommand: string;
  lintersFormatters: string[];
  ciCd: string[];
  monorepoTooling: string[];
  docker: string[];
}

export interface DependenciesData {
  runtime: DependencyItem[];
  dev: DependencyItem[];
}

export interface RepoBriefContext {
  generatedAt: string;
  rootDir: string;
  structure: StructureData;
  dependencies: DependenciesData;
  gitHistory: GitHistoryData;
  patterns: PatternsData;
}

export interface Exporter {
  readonly format: string;
  export(context: RepoBriefContext, outputDir: string): Promise<string>;
}
