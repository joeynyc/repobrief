import { simpleGit } from "simple-git";
import type { DefaultLogFields } from "simple-git";
import type { Analyzer, AnalysisResult, GitContributor, GitHistoryData, GitHotFile } from "../types.js";

const HOTFILE_IGNORE_PATTERNS = ["node_modules/", "dist/", ".git/", "build/", "coverage/", ".codemap/"];

function shouldIgnorePath(filePath: string): boolean {
  return HOTFILE_IGNORE_PATTERNS.some((pattern) => filePath === pattern.slice(0, -1) || filePath.includes(pattern));
}

function parseNumstat(content: string): GitHotFile[] {
  const counts = new Map<string, number>();
  for (const line of content.split(/\r?\n/)) {
    const parts = line.split("\t");
    if (parts.length !== 3) continue;
    const filePath = parts[2]?.trim();
    if (!filePath || shouldIgnorePath(filePath)) continue;
    counts.set(filePath, (counts.get(filePath) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([path, commits]) => ({ path, commits }))
    .sort((a, b) => b.commits - a.commits)
    .slice(0, 20);
}

function parseShortlog(content: string): GitContributor[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const match = line.match(/^(\d+)\s+(.+)$/);
      if (!match) return null;
      const commits = Number(match[1]);
      const authorRaw = match[2];
      const emailMatch = authorRaw.match(/<([^>]+)>/);
      return {
        name: authorRaw.replace(/<[^>]+>/, "").trim(),
        email: emailMatch?.[1] ?? "unknown",
        commits
      } satisfies GitContributor;
    })
    .filter((entry): entry is GitContributor => entry !== null)
    .slice(0, 10);
}

export class GitHistoryAnalyzer implements Analyzer<GitHistoryData> {
  public readonly name = "git-history";

  async analyze(rootDir: string): Promise<AnalysisResult<GitHistoryData>> {
    const git = simpleGit(rootDir);
    const isRepo = await git.checkIsRepo();

    if (!isRepo) {
      const empty: GitHistoryData = { hotFiles: [], recentCommits: [], contributors: [] };
      return {
        name: this.name,
        data: empty,
        summary: "No git repository detected"
      };
    }

    const [logResult, numstatRaw, shortlogRaw] = await Promise.all([
      git.log({ maxCount: 30 }),
      git.raw(["log", "--pretty=tformat:", "--numstat", "-n", "200"]),
      git.raw(["shortlog", "-sne", "HEAD"])
    ]);

    const data: GitHistoryData = {
      hotFiles: parseNumstat(numstatRaw),
      recentCommits: logResult.all.map((commit: DefaultLogFields) => ({
        hash: commit.hash,
        date: commit.date,
        message: commit.message,
        author: commit.author_name
      })),
      contributors: parseShortlog(shortlogRaw)
    };

    return {
      name: this.name,
      data,
      summary: `Analyzed ${data.recentCommits.length} recent commits and ${data.hotFiles.length} hot files`
    };
  }
}
