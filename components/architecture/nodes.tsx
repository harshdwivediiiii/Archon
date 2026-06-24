"use client";

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { NODE_COLORS } from "./theme";
import type { ModeNode } from "@/app/dashboard/architecture/utils/mode-transformers";
import { getTechIcon } from "@/lib/analysis/tech-icons";
import {
  Server, Database, Cpu, HardDrive, Layers, Globe, Shield,
  Activity, Zap, Box, GitBranch, Cloud, Bot,
} from "lucide-react";

const STATUS_INDICATORS: Record<string, { color: string; label: string }> = {
  healthy: { color: "#22c55e", label: "healthy" },
  warning: { color: "#f59e0b", label: "warning" },
  error: { color: "#ef4444", label: "critical" },
  unknown: { color: "#6b7280", label: "unknown" },
};

const NODE_ICONS: Record<string, React.ElementType> = {
  gateway: Globe,
  frontend: Cpu,
  backend: Server,
  service: Server,
  database: Database,
  queue: Activity,
  cache: Zap,
  search: HardDrive,
  infrastructure: Box,
  external: Cloud,
  knowledge: GitBranch,
  ai: Bot,
  ml: Bot,
  security: Shield,
  uml: Layers,
  uml_class: Layers,
  uml_interface: Layers,
  timeline: Activity,
  event: Activity,
  library: Box,
};

function computeStatus(data: ModeNode["data"]): { status: "healthy" | "warning" | "error" | "unknown"; label: string } {
  if (data.risk === "circular dependency") return { status: "error", label: "circular" };
  if (data.severity === "HIGH" || data.severity === "CRITICAL") return { status: "error", label: "critical" };
  if (data.dependencyCount > 20) return { status: "warning", label: "complex" };
  if (data.health?.score !== undefined && data.health.score < 50) return { status: "error", label: "unhealthy" };
  if (data.dependencyCount === 0 && data.nodeType !== "frontend" && data.nodeType !== "library") return { status: "warning", label: "isolated" };
  return { status: "healthy", label: "stable" };
}

interface TechIconDisplayProps {
  technology?: string;
  nodeType: string;
  size?: number;
}

function TechIconDisplay({ technology, nodeType, size = 18 }: TechIconDisplayProps) {
  const Component = technology ? getTechIcon(technology) : (NODE_ICONS[nodeType] || Server);
  const color = NODE_COLORS[nodeType]?.primary || "#6b7280";
  return (
    <div
      className="flex items-center justify-center rounded-lg"
      style={{
        backgroundColor: `${color}15`,
        width: size + 10,
        height: size + 10,
      }}
    >
      {React.createElement(Component, { size, className: "text-white", style: { color } })}
    </div>
  );
}

export const ServiceNode = memo(({ data, selected }: NodeProps<ModeNode>) => {
  const color = NODE_COLORS[data.nodeType] || NODE_COLORS.service;
  const { status, label: statusLabel } = computeStatus(data);

  return (
    <div
      className="rounded-xl transition-all duration-200 min-w-[220px]"
      style={{
        background: color.bg,
        border: `1.5px solid ${selected ? color.primary : color.border}`,
        boxShadow: selected
          ? `0 0 0 1px ${color.primary}40, 0 8px 32px rgba(0,0,0,0.5)`
          : "0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />

      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <TechIconDisplay technology={data.technologyIcon || data.technology} nodeType={data.nodeType} />
            <span
              className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0a0a0a]"
              style={{ backgroundColor: STATUS_INDICATORS[status]?.color || "#6b7280" }}
              title={statusLabel}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white" style={{ fontFamily: "Geist, Inter, sans-serif" }}>
              {data.label}
            </p>
            {data.technology && (
              <p className="truncate text-[11px] text-[#8b90a0]">{data.technology}</p>
            )}
          </div>
        </div>

        {data.description && (
          <p className="mt-1.5 text-[11px] leading-relaxed text-[#6b7280] line-clamp-2">
            {data.description}
          </p>
        )}

        <div className="mt-2 flex items-center gap-2 text-[10px] text-[#52525b]">
          {data.dependencyCount > 0 && (
            <span className="flex items-center gap-1">
              <GitBranch className="w-3 h-3" style={{ color: color.primary }} />
              <span style={{ color: color.primary }}>{data.dependencyCount} deps</span>
            </span>
          )}
          {data.port && (
            <span className="font-mono text-[#52525b]">:{data.port}</span>
          )}
        </div>
      </div>
    </div>
  );
});

ServiceNode.displayName = "ServiceNode";

export const DatabaseNode = memo(({ data, selected }: NodeProps<ModeNode>) => {
  const color = NODE_COLORS.database;
  const { status, label: statusLabel } = computeStatus(data);

  return (
    <div
      className="rounded-xl transition-all duration-200 min-w-[200px]"
      style={{
        background: color.bg,
        border: `1.5px solid ${selected ? color.primary : color.border}`,
        boxShadow: selected ? `0 0 0 1px ${color.primary}40` : "0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />

      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          <svg width="32" height="36" viewBox="0 0 32 36" fill="none" className="shrink-0">
            <ellipse cx="16" cy="8" rx="12" ry="5" stroke={color.primary} strokeWidth="1.5" fill={`${color.primary}10`} />
            <path d="M4 8v10c0 2.76 5.37 5 12 5s12-2.24 12-5V8" stroke={color.primary} strokeWidth="1.5" fill={`${color.primary}08`} />
            <path d="M4 18v10c0 2.76 5.37 5 12 5s12-2.24 12-5V18" stroke={color.primary} strokeWidth="1.5" fill={`${color.primary}05`} />
          </svg>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{data.label}</p>
            <p className="truncate text-[11px] text-[#8b90a0]">{data.technology || "Database"}</p>
          </div>
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: STATUS_INDICATORS[status]?.color }}
            title={statusLabel}
          />
        </div>

        {data.description && (
          <p className="mt-1.5 text-[11px] leading-relaxed text-[#6b7280] line-clamp-2">{data.description}</p>
        )}

        {data.databases && data.databases.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {data.databases.map((db) => (
              <span key={db} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${color.primary}15`, color: color.primary }}>
                {db}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

DatabaseNode.displayName = "DatabaseNode";

export const QueueNode = memo(({ data, selected }: NodeProps<ModeNode>) => {
  const color = NODE_COLORS.queue;
  const { status, label: statusLabel } = computeStatus(data);

  return (
    <div
      className="rounded-xl transition-all duration-200 min-w-[200px]"
      style={{
        background: color.bg,
        border: `1.5px solid ${selected ? color.primary : color.border}`,
        boxShadow: selected ? `0 0 0 1px ${color.primary}40` : "0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />

      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="shrink-0">
            <rect x="2" y="2" width="24" height="8" rx="3" stroke={color.primary} strokeWidth="1.5" fill={`${color.primary}10`} />
            <rect x="2" y="10" width="24" height="8" rx="3" stroke={color.primary} strokeWidth="1.5" fill={`${color.primary}08`} />
            <rect x="2" y="18" width="24" height="8" rx="3" stroke={color.primary} strokeWidth="1.5" fill={`${color.primary}05`} />
          </svg>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{data.label}</p>
            <p className="truncate text-[11px] text-[#8b90a0]">{data.technology || "Message Queue"}</p>
          </div>
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: STATUS_INDICATORS[status]?.color }}
            title={statusLabel}
          />
        </div>

        {data.description && (
          <p className="mt-1.5 text-[11px] leading-relaxed text-[#6b7280] line-clamp-2">{data.description}</p>
        )}
      </div>
    </div>
  );
});

QueueNode.displayName = "QueueNode";

export const GatewayNode = memo(({ data, selected }: NodeProps<ModeNode>) => {
  const color = NODE_COLORS.gateway;
  const { status } = computeStatus(data);

  return (
    <div
      className="rounded-xl transition-all duration-200 min-w-[200px]"
      style={{
        background: color.bg,
        border: `1.5px solid ${selected ? color.primary : color.border}`,
        boxShadow: selected ? `0 0 0 1px ${color.primary}40` : "0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />

      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none" className="shrink-0">
            <path d="M15 3L3 10v10l12 7 12-7V10L15 3z" stroke={color.primary} strokeWidth="1.5" fill={`${color.primary}10`} />
            <circle cx="15" cy="15" r="4" stroke={color.primary} strokeWidth="1.2" fill={`${color.primary}15`} />
            <path d="M11 15h8M15 11v8" stroke={color.primary} strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{data.label}</p>
            <p className="truncate text-[11px] text-[#8b90a0]">{data.technology || "API Gateway"}</p>
          </div>
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: STATUS_INDICATORS[status]?.color }}
          />
        </div>

        {data.endpoints && data.endpoints.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {data.endpoints.slice(0, 3).map((ep) => (
              <span key={ep} className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: `${color.primary}15`, color: color.primary }}>
                {ep}
              </span>
            ))}
            {data.endpoints.length > 3 && (
              <span className="text-[9px] text-[#52525b]">+{data.endpoints.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

GatewayNode.displayName = "GatewayNode";

export const SearchNode = memo(({ data, selected }: NodeProps<ModeNode>) => {
  const color = NODE_COLORS.search;

  return (
    <div
      className="rounded-xl transition-all duration-200 min-w-[200px]"
      style={{
        background: color.bg,
        border: `1.5px solid ${selected ? color.primary : color.border}`,
        boxShadow: selected ? `0 0 0 1px ${color.primary}40` : "0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />

      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="shrink-0">
            <circle cx="12" cy="12" r="8" stroke={color.primary} strokeWidth="1.5" fill={`${color.primary}10`} />
            <circle cx="12" cy="12" r="3" stroke={color.primary} strokeWidth="1" fill={`${color.primary}15`} />
            <path d="M18 18l6 6" stroke={color.primary} strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{data.label}</p>
            <p className="truncate text-[11px] text-[#8b90a0]">{data.technology || "Search Infrastructure"}</p>
          </div>
        </div>

        {data.description && (
          <p className="mt-1.5 text-[11px] leading-relaxed text-[#6b7280] line-clamp-2">{data.description}</p>
        )}
      </div>
    </div>
  );
});

SearchNode.displayName = "SearchNode";

export const InfrastructureNode = memo(({ data, selected }: NodeProps<ModeNode>) => {
  const color = NODE_COLORS.infrastructure;

  return (
    <div
      className="rounded-xl transition-all duration-200 min-w-[200px]"
      style={{
        background: color.bg,
        border: `1.5px solid ${selected ? color.primary : color.border}`,
        boxShadow: selected ? `0 0 0 1px ${color.primary}40` : "0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />

      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          <svg width="30" height="24" viewBox="0 0 30 24" fill="none" className="shrink-0">
            <rect x="3" y="2" width="24" height="20" rx="3" stroke={color.primary} strokeWidth="1.5" fill={`${color.primary}08`} />
            <rect x="8" y="6" width="6" height="4" rx="1" stroke={color.primary} strokeWidth="1" fill={`${color.primary}12`} />
            <rect x="16" y="6" width="6" height="4" rx="1" stroke={color.primary} strokeWidth="1" fill={`${color.primary}12`} />
            <rect x="8" y="12" width="6" height="4" rx="1" stroke={color.primary} strokeWidth="1" fill={`${color.primary}12`} />
            <rect x="16" y="12" width="6" height="4" rx="1" stroke={color.primary} strokeWidth="1" fill={`${color.primary}12`} />
            <path d="M15 2V0M15 24v-2" stroke={color.primary} strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
          </svg>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{data.label}</p>
            <p className="truncate text-[11px] text-[#8b90a0]">{data.technology || "Infrastructure"}</p>
          </div>
        </div>

        {data.description && (
          <p className="mt-1.5 text-[11px] leading-relaxed text-[#6b7280] line-clamp-2">{data.description}</p>
        )}
      </div>
    </div>
  );
});

InfrastructureNode.displayName = "InfrastructureNode";

export const ExternalNode = memo(({ data, selected }: NodeProps<ModeNode>) => {
  const color = NODE_COLORS.external;

  return (
    <div
      className="rounded-xl transition-all duration-200 min-w-[200px]"
      style={{
        background: color.bg,
        border: `1.5px solid ${selected ? color.primary : color.border}`,
        boxShadow: selected ? `0 0 0 1px ${color.primary}40` : "0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />

      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="shrink-0">
            <circle cx="14" cy="14" r="11" stroke={color.primary} strokeWidth="1.5" fill={`${color.primary}08`} />
            <circle cx="14" cy="14" r="4" stroke={color.primary} strokeWidth="1" fill={`${color.primary}12`} />
            <path d="M14 3v3M14 22v3M3 14h3M22 14h3" stroke={color.primary} strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
          </svg>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{data.label}</p>
            <p className="truncate text-[11px] text-[#8b90a0]">{data.technology || "External API"}</p>
          </div>
        </div>

        {data.description && (
          <p className="mt-1.5 text-[11px] leading-relaxed text-[#6b7280] line-clamp-2">{data.description}</p>
        )}
      </div>
    </div>
  );
});

ExternalNode.displayName = "ExternalNode";

export const AINode = memo(({ data, selected }: NodeProps<ModeNode>) => {
  const color = NODE_COLORS.ai;

  return (
    <div
      className="rounded-xl transition-all duration-200 min-w-[200px]"
      style={{
        background: color.bg,
        border: `1.5px solid ${selected ? color.primary : color.border}`,
        boxShadow: selected ? `0 0 0 1px ${color.primary}40` : "0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />

      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="shrink-0">
            <circle cx="14" cy="14" r="10" stroke={color.primary} strokeWidth="1.5" fill={`${color.primary}08`} />
            <circle cx="10" cy="10" r="2" stroke={color.primary} strokeWidth="1" fill={`${color.primary}20`} />
            <circle cx="18" cy="10" r="2" stroke={color.primary} strokeWidth="1" fill={`${color.primary}20`} />
            <circle cx="14" cy="18" r="2" stroke={color.primary} strokeWidth="1" fill={`${color.primary}20`} />
            <path d="M10 10l4 4M18 10l-4 4M12 16l2 2" stroke={color.primary} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
          </svg>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{data.label}</p>
            <p className="truncate text-[11px] text-[#8b90a0]">{data.technology || "AI / ML"}</p>
          </div>
        </div>

        {data.description && (
          <p className="mt-1.5 text-[11px] leading-relaxed text-[#6b7280] line-clamp-2">{data.description}</p>
        )}
      </div>
    </div>
  );
});

AINode.displayName = "AINode";

export const KnowledgeNode = memo(({ data, selected }: NodeProps<ModeNode>) => {
  const color = NODE_COLORS.knowledge;

  return (
    <div
      className="rounded-xl transition-all duration-200 min-w-[180px]"
      style={{
        background: color.bg,
        border: `1.5px solid ${selected ? color.primary : color.border}`,
        boxShadow: selected ? `0 0 0 1px ${color.primary}40` : "0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />

      <div className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: color.primary, boxShadow: `0 0 6px ${color.primary}` }}
          />
          <p className="text-sm font-semibold text-white truncate">{data.label}</p>
        </div>
        <p className="mt-0.5 text-[10px] text-[#6b7280] truncate">{data.technology || data.nodeType}</p>
        {data.description && (
          <p className="mt-1 text-[10px] leading-relaxed text-[#52525b] line-clamp-1">{data.description}</p>
        )}
      </div>
    </div>
  );
});

KnowledgeNode.displayName = "KnowledgeNode";

export const nodeTypes = {
  default: ServiceNode,
  service: ServiceNode,
  gateway: GatewayNode,
  frontend: ServiceNode,
  backend: ServiceNode,
  database: DatabaseNode,
  queue: QueueNode,
  cache: ServiceNode,
  search: SearchNode,
  infrastructure: InfrastructureNode,
  external: ExternalNode,
  ai: AINode,
  ml: AINode,
  knowledge: KnowledgeNode,
  security: ServiceNode,
  timeline: ServiceNode,
  uml_class: ServiceNode,
  uml_interface: ServiceNode,
  event: QueueNode,
  library: ServiceNode,
  env_var: ServiceNode,
  config: ServiceNode,
  cloud: InfrastructureNode,
  cdn: ServiceNode,
  container: ServiceNode,
  certificate: ServiceNode,
  secret: ServiceNode,
  health: ServiceNode,
  timeline_node: ServiceNode,
  custom: ServiceNode,
};
