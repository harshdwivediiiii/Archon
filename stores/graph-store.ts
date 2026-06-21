import { create } from "zustand";
import type { Node, Edge } from "@xyflow/react";

interface GraphStore {
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: Node) => void;
  addEdge: (edge: Edge) => void;
  setSelectedNode: (node: Node | null) => void;
  reset: () => void;
}

export const useGraphStore = create<GraphStore>((set) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
  addEdge: (edge) => set((state) => ({ edges: [...state.edges, edge] })),
  setSelectedNode: (selectedNode) => set({ selectedNode }),
  reset: () => set({ nodes: [], edges: [], selectedNode: null }),
}));
