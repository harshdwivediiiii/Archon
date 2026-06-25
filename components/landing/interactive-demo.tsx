"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Network, Layers, Container, Workflow, ZoomIn, ZoomOut, Search, Eye } from "lucide-react";

const tabs = [
  { id: "system", label: "System Architecture", icon: Network },
  { id: "uml", label: "UML Diagram", icon: Layers },
  { id: "infra", label: "Infrastructure", icon: Container },
  { id: "dataflow", label: "Data Flow", icon: Workflow },
];

function SystemArchitectureView() {
  return (
    <div className="rounded-xl overflow-hidden border border-outline-variant/30 bg-[#0b0e15]">
      <svg className="w-full" viewBox="0 0 900 320" preserveAspectRatio="xMidYMid meet">
        <text x="450" y="30" textAnchor="middle" fill="#e0e2ed" fontSize="13" fontWeight="700" fontFamily="Geist, sans-serif">Architecture Overview</text>
        <rect x="380" y="50" width="140" height="36" rx="18" fill="#10131b" stroke="#0070f3" strokeWidth="1.5" />
        <text x="450" y="73" textAnchor="middle" fill="#e0e2ed" fontSize="11" fontWeight="600">Users</text>
        <path d="M450,86 L450,105" fill="none" stroke="#0070f3" strokeOpacity="0.5" strokeWidth="1.5" className="animate-edge-flow" />
        <rect x="350" y="105" width="200" height="36" rx="6" fill="#10131b" stroke="#3b82f6" strokeWidth="1.5" />
        <text x="450" y="128" textAnchor="middle" fill="#e0e2ed" fontSize="11" fontWeight="600">Next.js Frontend</text>
        <path d="M450,141 L450,160" fill="none" stroke="#0070f3" strokeOpacity="0.5" strokeWidth="1.5" className="animate-edge-flow" />
        <rect x="300" y="160" width="300" height="36" rx="6" fill="#10131b" stroke="#10b981" strokeWidth="1.5" />
        <text x="450" y="183" textAnchor="middle" fill="#e0e2ed" fontSize="11" fontWeight="600">API Gateway → Auth Service → Business Logic</text>
        <path d="M450,196 L450,215" fill="none" stroke="#0070f3" strokeOpacity="0.5" strokeWidth="1.5" className="animate-edge-flow" />
        <rect x="250" y="215" width="400" height="36" rx="6" fill="#10131b" stroke="#f59e0b" strokeWidth="1.5" />
        <text x="450" y="238" textAnchor="middle" fill="#e0e2ed" fontSize="11" fontWeight="600">PostgreSQL  Redis Cache  Elasticsearch  S3</text>
        <path d="M450,251 L450,270" fill="none" stroke="#0070f3" strokeOpacity="0.5" strokeWidth="1.5" className="animate-edge-flow" />
        <rect x="300" y="270" width="300" height="36" rx="6" fill="#10131b" stroke="#8b5cf6" strokeWidth="1.5" />
        <text x="450" y="293" textAnchor="middle" fill="#e0e2ed" fontSize="11" fontWeight="600">Docker  Kubernetes  Terraform  AWS</text>
        <text x="100" y="128" textAnchor="end" fill="#8b90a0" fontSize="9" fontFamily="Geist, sans-serif">FRONTEND</text>
        <text x="100" y="183" textAnchor="end" fill="#8b90a0" fontSize="9" fontFamily="Geist, sans-serif">SERVICES</text>
        <text x="100" y="238" textAnchor="end" fill="#8b90a0" fontSize="9" fontFamily="Geist, sans-serif">DATA</text>
        <text x="100" y="293" textAnchor="end" fill="#8b90a0" fontSize="9" fontFamily="Geist, sans-serif">INFRA</text>
      </svg>
    </div>
  );
}

function UMLView() {
  return (
    <div className="rounded-xl overflow-hidden border border-outline-variant/30 bg-[#0b0e15]">
      <svg className="w-full" viewBox="0 0 900 340" preserveAspectRatio="xMidYMid meet">
        <rect x="50" y="40" width="220" height="24" rx="4" fill="#3b82f6" opacity="0.15" />
        <rect x="50" y="64" width="220" height="24" fill="#3b82f6" opacity="0.08" />
        <rect x="50" y="88" width="220" height="24" fill="#3b82f6" opacity="0.05" />
        <rect x="50" y="40" width="220" height="72" rx="4" fill="none" stroke="#3b82f6" strokeOpacity="0.4" strokeWidth="1" />
        <text x="160" y="55" textAnchor="middle" fill="#3b82f6" fontSize="11" fontWeight="700" fontFamily="Geist Mono, monospace">AuthController</text>
        <text x="65" y="79" fill="#c1c6d7" fontSize="9" fontFamily="Geist Mono, monospace">- jwtService: JwtService</text>
        <text x="65" y="103" fill="#c1c6d7" fontSize="9" fontFamily="Geist Mono, monospace">+ login(req, res): void</text>
        <rect x="340" y="40" width="220" height="24" rx="4" fill="#10b981" opacity="0.15" />
        <rect x="340" y="64" width="220" height="48" fill="#10b981" opacity="0.08" />
        <rect x="340" y="40" width="220" height="72" rx="4" fill="none" stroke="#10b981" strokeOpacity="0.4" strokeWidth="1" />
        <text x="450" y="55" textAnchor="middle" fill="#10b981" fontSize="11" fontWeight="700" fontFamily="Geist Mono, monospace">UserService</text>
        <text x="355" y="79" fill="#c1c6d7" fontSize="9" fontFamily="Geist Mono, monospace">- userRepository: Repository</text>
        <text x="355" y="103" fill="#c1c6d7" fontSize="9" fontFamily="Geist Mono, monospace">+ findById(id): User</text>
        <rect x="630" y="40" width="220" height="24" rx="4" fill="#8b5cf6" opacity="0.15" />
        <rect x="630" y="64" width="220" height="48" fill="#8b5cf6" opacity="0.08" />
        <rect x="630" y="40" width="220" height="72" rx="4" fill="none" stroke="#8b5cf6" strokeOpacity="0.4" strokeWidth="1" />
        <text x="740" y="55" textAnchor="middle" fill="#8b5cf6" fontSize="11" fontWeight="700" fontFamily="Geist Mono, monospace">UserEntity</text>
        <text x="645" y="79" fill="#c1c6d7" fontSize="9" fontFamily="Geist Mono, monospace">- id: UUID</text>
        <text x="645" y="103" fill="#c1c6d7" fontSize="9" fontFamily="Geist Mono, monospace">+ email: string</text>
        <rect x="200" y="170" width="200" height="24" rx="4" fill="#dbb8ff" opacity="0.15" />
        <rect x="200" y="194" width="200" height="24" fill="#dbb8ff" opacity="0.08" />
        <rect x="200" y="170" width="200" height="48" rx="4" fill="none" stroke="#dbb8ff" strokeOpacity="0.4" strokeWidth="1" strokeDasharray="4" />
        <text x="300" y="185" textAnchor="middle" fill="#dbb8ff" fontSize="11" fontWeight="700" fontFamily="Geist Mono, monospace">{'«interface» IAuthService'}</text>
        <text x="215" y="209" fill="#c1c6d7" fontSize="9" fontFamily="Geist Mono, monospace">+ validateToken(token): boolean</text>
        <rect x="500" y="170" width="200" height="24" rx="4" fill="#06b6d4" opacity="0.15" />
        <rect x="500" y="194" width="200" height="48" fill="#06b6d4" opacity="0.08" />
        <rect x="500" y="170" width="200" height="72" rx="4" fill="none" stroke="#06b6d4" strokeOpacity="0.4" strokeWidth="1" />
        <text x="600" y="185" textAnchor="middle" fill="#06b6d4" fontSize="11" fontWeight="700" fontFamily="Geist Mono, monospace">JwtService</text>
        <text x="515" y="209" fill="#c1c6d7" fontSize="9" fontFamily="Geist Mono, monospace">- secretKey: string</text>
        <text x="515" y="233" fill="#c1c6d7" fontSize="9" fontFamily="Geist Mono, monospace">+ sign(payload): string</text>
        <polygon points="270,162 280,172 260,172" fill="none" stroke="#8b90a0" strokeWidth="1" />
        <line x1="270" y1="112" x2="270" y2="170" stroke="#8b90a0" strokeWidth="1" />
        <line x1="160" y1="112" x2="340" y2="90" stroke="#8b90a0" strokeWidth="1" strokeDasharray="4" />
        <text x="250" y="87" fill="#8b90a0" fontSize="8" fontFamily="Geist Mono, monospace">uses</text>
        <line x1="450" y1="112" x2="500" y2="200" stroke="#8b90a0" strokeWidth="1" strokeDasharray="4" />
        <text x="460" y="165" fill="#8b90a0" fontSize="8" fontFamily="Geist Mono, monospace">implements</text>
        <line x1="630" y1="76" x2="600" y2="200" stroke="#8b90a0" strokeWidth="1" />
        <polygon points="600,200 590,190 610,190" fill="#8b90a0" />
        <text x="560" y="130" fill="#8b90a0" fontSize="8" fontFamily="Geist Mono, monospace">composition</text>
      </svg>
    </div>
  );
}

function InfrastructureView() {
  return (
    <div className="rounded-xl overflow-hidden border border-outline-variant/30 bg-[#0b0e15]">
      <svg className="w-full" viewBox="0 0 900 300" preserveAspectRatio="xMidYMid meet">
        <text x="450" y="25" textAnchor="middle" fill="#e0e2ed" fontSize="13" fontWeight="700" fontFamily="Geist, sans-serif">Deployment Architecture</text>
        <rect x="370" y="45" width="160" height="36" rx="18" fill="#10131b" stroke="#8b5cf6" strokeWidth="1.5" />
        <text x="450" y="68" textAnchor="middle" fill="#e0e2ed" fontSize="11" fontWeight="600">Load Balancer</text>
        <path d="M400,81 L350,115" fill="none" stroke="#8b90a0" strokeOpacity="0.4" strokeWidth="1.5" className="animate-edge-flow" />
        <path d="M450,81 L450,115" fill="none" stroke="#8b90a0" strokeOpacity="0.4" strokeWidth="1.5" className="animate-edge-flow" />
        <path d="M500,81 L550,115" fill="none" stroke="#8b90a0" strokeOpacity="0.4" strokeWidth="1.5" className="animate-edge-flow" />
        <rect x="370" y="115" width="160" height="36" rx="6" fill="#10131b" stroke="#06b6d4" strokeWidth="1.5" />
        <text x="450" y="138" textAnchor="middle" fill="#e0e2ed" fontSize="11" fontWeight="600">K8s Ingress</text>
        <path d="M300,151 L300,190" fill="none" stroke="#8b90a0" strokeOpacity="0.4" strokeWidth="1.5" className="animate-edge-flow" />
        <path d="M450,151 L450,190" fill="none" stroke="#8b90a0" strokeOpacity="0.4" strokeWidth="1.5" className="animate-edge-flow" />
        <path d="M600,151 L600,190" fill="none" stroke="#8b90a0" strokeOpacity="0.4" strokeWidth="1.5" className="animate-edge-flow" />
        <rect x="220" y="190" width="160" height="36" rx="6" fill="#10131b" stroke="#10b981" strokeWidth="1.5" />
        <text x="300" y="213" textAnchor="middle" fill="#e0e2ed" fontSize="11" fontWeight="600">Web Service</text>
        <rect x="370" y="190" width="160" height="36" rx="6" fill="#10131b" stroke="#10b981" strokeWidth="1.5" />
        <text x="450" y="213" textAnchor="middle" fill="#e0e2ed" fontSize="11" fontWeight="600">Auth Service</text>
        <rect x="520" y="190" width="160" height="36" rx="6" fill="#10131b" stroke="#10b981" strokeWidth="1.5" />
        <text x="600" y="213" textAnchor="middle" fill="#e0e2ed" fontSize="11" fontWeight="600">API Service</text>
        <path d="M300,226 L300,255" fill="none" stroke="#f59e0b" strokeOpacity="0.4" strokeWidth="1.5" className="animate-edge-flow" />
        <path d="M450,226 L450,255" fill="none" stroke="#f59e0b" strokeOpacity="0.4" strokeWidth="1.5" className="animate-edge-flow" />
        <path d="M600,226 L600,255" fill="none" stroke="#f59e0b" strokeOpacity="0.4" strokeWidth="1.5" className="animate-edge-flow" />
        <rect x="320" y="255" width="260" height="36" rx="6" fill="#10131b" stroke="#f59e0b" strokeWidth="1.5" />
        <text x="450" y="278" textAnchor="middle" fill="#e0e2ed" fontSize="11" fontWeight="600">PostgreSQL  |  Redis  |  S3</text>
      </svg>
    </div>
  );
}

function DataFlowView() {
  return (
    <div className="rounded-xl overflow-hidden border border-outline-variant/30 bg-[#0b0e15]">
      <svg className="w-full" viewBox="0 0 900 280" preserveAspectRatio="xMidYMid meet">
        <text x="450" y="25" textAnchor="middle" fill="#e0e2ed" fontSize="13" fontWeight="700" fontFamily="Geist, sans-serif">Data & Event Flow</text>
        <rect x="30" y="60" width="120" height="40" rx="20" fill="#10131b" stroke="#0070f3" strokeWidth="1.5" />
        <text x="90" y="85" textAnchor="middle" fill="#e0e2ed" fontSize="11" fontWeight="600">Users</text>
        <path d="M150,80 L260,80" fill="none" stroke="#3b82f6" strokeOpacity="0.6" strokeWidth="2" className="animate-edge-flow" />
        <text x="205" y="70" textAnchor="middle" fill="#3b82f6" fontSize="8" fontFamily="Geist Mono, monospace">POST /api/login</text>
        <rect x="260" y="55" width="140" height="50" rx="8" fill="#10131b" stroke="#3b82f6" strokeWidth="1.5" />
        <text x="330" y="85" textAnchor="middle" fill="#e0e2ed" fontSize="11" fontWeight="600">Next.js App</text>
        <path d="M400,80 L520,80" fill="none" stroke="#10b981" strokeOpacity="0.6" strokeWidth="2" className="animate-edge-flow" />
        <text x="460" y="70" textAnchor="middle" fill="#10b981" fontSize="8" fontFamily="Geist Mono, monospace">Auth Request</text>
        <rect x="520" y="55" width="140" height="50" rx="8" fill="#10131b" stroke="#10b981" strokeWidth="1.5" />
        <text x="590" y="85" textAnchor="middle" fill="#e0e2ed" fontSize="11" fontWeight="600">Auth Service</text>
        <path d="M590,105 L590,140 L330,140 L330,170" fill="none" stroke="#ef4444" strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="6,3" />
        <text x="460" y="130" fill="#ef4444" fontSize="8" fontFamily="Geist Mono, monospace">Session Store</text>
        <rect x="260" y="170" width="140" height="40" rx="8" fill="#10131b" stroke="#ef4444" strokeWidth="1.5" />
        <text x="330" y="195" textAnchor="middle" fill="#e0e2ed" fontSize="11" fontWeight="600">Redis Cache</text>
        <path d="M660,80 L780,80" fill="none" stroke="#f59e0b" strokeOpacity="0.6" strokeWidth="2" className="animate-edge-flow" />
        <text x="720" y="70" textAnchor="middle" fill="#f59e0b" fontSize="8" fontFamily="Geist Mono, monospace">DB Query</text>
        <rect x="780" y="55" width="110" height="50" rx="8" fill="#10131b" stroke="#f59e0b" strokeWidth="1.5" />
        <text x="835" y="85" textAnchor="middle" fill="#e0e2ed" fontSize="11" fontWeight="600">PostgreSQL</text>
        <path d="M660,90 L520,90" fill="none" stroke="#10b981" strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="4" />
        <path d="M400,90 L260,90" fill="none" stroke="#3b82f6" strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="4" />
        <rect x="260" y="235" width="480" height="30" rx="6" fill="#10131b" stroke="#8b5cf6" strokeWidth="1" strokeDasharray="4" />
        <text x="500" y="254" textAnchor="middle" fill="#8b5cf6" fontSize="9" fontFamily="Geist, sans-serif">Event Bus: UserCreated, SessionExpired, DataSynced</text>
        <path d="M590,105 L760,235" fill="none" stroke="#8b5cf6" strokeOpacity="0.4" strokeWidth="1" strokeDasharray="4" />
        <text x="700" y="160" fill="#8b5cf6" fontSize="8" fontFamily="Geist Mono, monospace">publish</text>
      </svg>
    </div>
  );
}

export function InteractiveDemo() {
  const [activeTab, setActiveTab] = useState("system");

  return (
    <section id="demo" className="py-24 px-6 bg-surface-container-lowest/50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-on-surface mb-4 tracking-tight">Interactive Architecture Preview</h2>
          <p className="text-base md:text-lg text-on-surface-variant max-w-xl mx-auto">
            Zoom, pan, search, and inspect every node. Every diagram is derived from actual repository analysis.
          </p>
        </motion.div>

        <motion.div
          className="glass rounded-xl border border-outline-variant/30 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <div className="border-b border-outline-variant/30 px-4 pt-4 flex items-center justify-between">
            <div className="flex gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-t-lg transition-all ${
                      isActive
                        ? "bg-surface-container text-primary-container border border-b-0 border-outline-variant/30 -mb-px"
                        : "text-muted-foreground hover:text-on-surface hover:bg-surface-container-higher/50"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <div className="hidden md:flex items-center gap-2 text-muted-foreground">
              <ZoomIn className="w-4 h-4" />
              <ZoomOut className="w-4 h-4" />
              <Search className="w-4 h-4" />
              <Eye className="w-4 h-4" />
            </div>
          </div>

          <div className="p-6">
            {activeTab === "system" && <SystemArchitectureView />}
            {activeTab === "uml" && <UMLView />}
            {activeTab === "infra" && <InfrastructureView />}
            {activeTab === "dataflow" && <DataFlowView />}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
