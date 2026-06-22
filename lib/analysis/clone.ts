import simpleGit from "simple-git";
import { existsSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

const CLONE_BASE_DIR = join(tmpdir(), "archon-analysis");

function getCloneDir(fullName: string): string {
  const safeName = fullName.replace(/[^a-zA-Z0-9_-]/g, "_");
  return join(CLONE_BASE_DIR, `${safeName}-${randomUUID()}`);
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
    await Promise.race([
      git.clone(cloneUrl, targetDir, ["--depth", "1"]),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Clone timeout after 5 minutes")), 300000)
      ),
    ]);
    return targetDir;
  } catch (error) {
    if (existsSync(targetDir)) {
      rmSync(targetDir, { recursive: true, force: true });
    }
    const sanitized = error instanceof Error
      ? new Error(error.message.replace(/https?:\/\/[^@]*@/, "https://***@"))
      : error;
    throw sanitized;
  }
}
