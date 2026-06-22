import dagre from "dagre";
import type { Node, Edge } from "@xyflow/react";

const NODE_WIDTH = 220;
const NODE_HEIGHT = 120;

export function computeDagreLayout<N extends Node, E extends Edge>(
  nodes: N[],
  edges: E[],
  direction: "LR" | "TB" = "LR"
): N[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 80, ranksep: 150, marginx: 50, marginy: 50 });

  for (const node of nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const dagreNode = g.node(node.id);
    if (!dagreNode) return node;
    return {
      ...node,
      position: {
        x: dagreNode.x - NODE_WIDTH / 2,
        y: dagreNode.y - NODE_HEIGHT / 2,
      },
    };
  });
}

export function computeLayerLayout<N extends { data: { layer?: string } } & Node>(
  nodes: N[],
  edges: Edge[],
  layerOrder: { key: string; label: string }[]
): N[] {
  if (nodes.length === 0) return nodes;

  const layerMap = new Map<string, N[]>();
  for (const n of nodes) {
    const layer = n.data?.layer || "service";
    if (!layerMap.has(layer)) layerMap.set(layer, []);
    layerMap.get(layer)!.push(n);
  }

  const LAYER_SPACING = 240;
  const NODE_SPACING = 280;

  return nodes.map((n) => {
    const layer = n.data?.layer || "service";
    const layerIdx = layerOrder.findIndex((l) => l.key === layer);
    const layerNodes = layerMap.get(layer) || [];
    const idx = layerNodes.indexOf(n);
    const totalWidth = (layerNodes.length - 1) * NODE_SPACING;
    const startX = -totalWidth / 2 + 400;
    return {
      ...n,
      position: {
        x: startX + idx * NODE_SPACING,
        y: 80 + Math.max(0, layerIdx) * LAYER_SPACING,
      },
    };
  });
}
