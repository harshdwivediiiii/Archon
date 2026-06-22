import { AnalysisProgress } from "./types";

const clients = new Map<string, Set<(progress: AnalysisProgress) => void>>();

export function subscribeToAnalysis(
  repositoryId: string,
  callback: (progress: AnalysisProgress) => void
): () => void {
  if (!clients.has(repositoryId)) {
    clients.set(repositoryId, new Set());
  }
  clients.get(repositoryId)!.add(callback);

  return () => {
    clients.get(repositoryId)?.delete(callback);
    if (clients.get(repositoryId)?.size === 0) {
      clients.delete(repositoryId);
    }
  };
}

export function publishProgress(progress: AnalysisProgress): void {
  const subscribers = clients.get(progress.analysisId);
  if (subscribers) {
    for (const callback of subscribers) {
      try {
        callback(progress);
      } catch {
        // Client disconnected, skip
      }
    }
  }
}

export function getAnalysisProgressPublisher(
  _repositoryId: string
): (progress: AnalysisProgress) => void {
  void _repositoryId;
  return (progress: AnalysisProgress) => {
    publishProgress(progress);
  };
}
