"use client";

import React from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  type EdgeProps,
  type Edge,
} from "@xyflow/react";
import { EDGE_COLORS } from "./theme";

export type AnimatedEdgeData = {
  label?: string;
  protocol?: string;
  animated?: boolean;
  dataType?: "request" | "response" | "event" | "query" | "stream" | "sync";
  packets?: number;
  latency?: number;
  width?: number;
};

export type AnimatedEdge = Edge<AnimatedEdgeData>;

export function AnimatedSmoothStepEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  style,
}: EdgeProps<AnimatedEdge>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 12,
  });

  const protocol = data?.protocol || "DEFAULT";
  const edgeColor = EDGE_COLORS[protocol]?.stroke || EDGE_COLORS.DEFAULT.stroke;
  const dashArray = data?.protocol ? EDGE_COLORS[protocol]?.dash : undefined;
  const displayLabel = data?.label || EDGE_COLORS[protocol]?.label || "";

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: edgeColor,
          strokeWidth: selected ? 2.5 : 1.5,
          strokeDasharray: dashArray || "none",
          opacity: selected ? 1 : 0.6,
          transition: "all 0.2s",
          ...style,
        }}
      />
      {/* Arrow marker is now on the BaseEdge via markerEnd */}
      {data?.packets &&
        Array.from({ length: data.packets || 3 }).map((_, i) => (
          <circle
            key={`packet-${id}-${i}`}
            r={2.5}
            fill={edgeColor}
            opacity={0.8}
            style={{ filter: `drop-shadow(0 0 3px ${edgeColor})` }}
          >
            <animateMotion
              dur={`${1.5 + i * 0.3}s`}
              repeatCount="indefinite"
              begin={`${i * 0.4}s`}
              path={edgePath}
            />
          </circle>
        ))}
      {displayLabel && (
        <EdgeLabelRenderer>
          <div
            className="absolute pointer-events-none px-2 py-0.5 rounded"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: `${edgeColor}15`,
              border: `1px solid ${edgeColor}30`,
              color: edgeColor,
              fontSize: 9,
              fontWeight: 500,
              fontFamily: "Geist, Inter, monospace",
              letterSpacing: "0.02em",
              whiteSpace: "nowrap",
              backdropFilter: "blur(4px)",
            }}
          >
            {displayLabel}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export function AnimatedBezierEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  style,
}: EdgeProps<AnimatedEdge>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const protocol = data?.protocol || "DEFAULT";
  const edgeColor = EDGE_COLORS[protocol]?.stroke || EDGE_COLORS.DEFAULT.stroke;
  const dashArray = data?.protocol ? EDGE_COLORS[protocol]?.dash : undefined;
  const displayLabel = data?.label || EDGE_COLORS[protocol]?.label || "";

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: edgeColor,
          strokeWidth: selected ? 2.5 : 1.5,
          strokeDasharray: dashArray || "none",
          opacity: selected ? 1 : 0.6,
          transition: "all 0.2s",
          ...style,
        }}
      />
      {data?.packets &&
        Array.from({ length: data.packets || 3 }).map((_, i) => (
          <circle
            key={`packet-${id}-${i}`}
            r={2.5}
            fill={edgeColor}
            opacity={0.8}
            style={{ filter: `drop-shadow(0 0 3px ${edgeColor})` }}
          >
            <animateMotion
              dur={`${1.5 + i * 0.3}s`}
              repeatCount="indefinite"
              begin={`${i * 0.4}s`}
              path={edgePath}
            />
          </circle>
        ))}
      {displayLabel && (
        <EdgeLabelRenderer>
          <div
            className="absolute pointer-events-none px-2 py-0.5 rounded"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: `${edgeColor}15`,
              border: `1px solid ${edgeColor}30`,
              color: edgeColor,
              fontSize: 9,
              fontWeight: 500,
              fontFamily: "Geist, Inter, monospace",
              letterSpacing: "0.02em",
              whiteSpace: "nowrap",
              backdropFilter: "blur(4px)",
            }}
          >
            {displayLabel}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const edgeTypes = {
  animatedSmoothStep: AnimatedSmoothStepEdge,
  animatedBezier: AnimatedBezierEdge,
};

export function buildEdgeStyle(protocol: string, selected?: boolean) {
  const config = EDGE_COLORS[protocol] || EDGE_COLORS.DEFAULT;
  return {
    stroke: config.stroke,
    strokeWidth: selected ? 2.5 : 1.5,
    strokeDasharray: config.dash || "none",
    opacity: selected ? 1 : 0.6,
  };
}

export function buildEdgeMarkerEnd(protocol: string) {
  const config = EDGE_COLORS[protocol] || EDGE_COLORS.DEFAULT;
  return {
    type: "arrowclosed" as const,
    width: 16,
    height: 16,
    color: config.stroke,
  };
}
