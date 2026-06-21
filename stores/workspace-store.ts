import { create } from "zustand";

interface Workspace {
  id: string;
  name: string;
  slug: string;
}

interface WorkspaceStore {
  workspace: Workspace | null;
  workspaces: Workspace[];
  setWorkspace: (workspace: Workspace | null) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  workspace: null,
  workspaces: [],
  setWorkspace: (workspace) => set({ workspace }),
  setWorkspaces: (workspaces) => set({ workspaces }),
}));
