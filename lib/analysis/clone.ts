import simpleGit from "simple-git";
import { existsSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const CLONE_BASE_DIR = join(tmpdir(), "archon-analysis");

export function getCloneDir(fullName: string): string {
  return join(CLONE_BASE_DIR, fullName.replace("/", "_"));
}

export async function cloneRepository(
  fullName: string,
  cloneUrl: string,
  onProgress?: (stage: string, percent: number) => void
): Promise<string> {
  const targetDir = getCloneDir(fullName);

  if (existsSync(targetDir)) {
    rmSync(targetDir, { recursive: true, force: true });
  }

  mkdirSync(targetDir, { recursive: true });

  const git = simpleGit({
    progress: ({ progress: prog }) => {
      const percent = Math.min(100, Math.round((prog / 100) * 100));
      onProgress?.("cloning", percent);
    },
  });

  try {
    await git.clone(cloneUrl, targetDir, ["--depth", "1"]);
    return targetDir;
  } catch (error) {
    if (existsSync(targetDir)) {
      rmSync(targetDir, { recursive: true, force: true });
    }
    throw error;
  }
}
