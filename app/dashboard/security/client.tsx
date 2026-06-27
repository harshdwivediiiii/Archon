"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Bug,
  Search,
  Loader2,
  Package,
  Eye,
  Container,
  BookOpen,
  ArrowRight,
  ExternalLink,
  X,
} from "lucide-react";

interface ScanSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  none: number;
}

interface SecurityFinding {
  id: string;
  package: string;
  version: string;
  severity: "critical" | "high" | "medium" | "low" | "none";
  description: string;
  cve: string;
  fixVersion: string;
  source: string;
}

interface ScanResult {
  summary: ScanSummary;
  findings: SecurityFinding[];
  scanTime: string;
}

interface SecretFinding {
  id: string;
  type: string;
  description: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  filePath: string;
  lineNumber: number;
  codeSnippet: string;
  detectedAt: string;
  isValidated: boolean;
}

interface SecretScanResult {
  filename: string;
  total: number;
  findings: SecretFinding[];
}

interface ContainerVulnerabilityItem {
  id: string;
  cveId: string;
  source: string;
  title: string;
  description: string;
  severity: string;
  cvssScore: number;
  packageName: string;
  packageVersion: string;
  fixVersion: string;
  status: string;
}

interface ContainerScanResult {
  image: string;
  imageDigest: string;
  os: { family: string; version: string };
  vulnerabilities: ContainerVulnerabilityItem[];
  score: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  scannedAt: string;
}

interface OWASPRecommendation {
  category: string;
  risk: string;
  recommendation: string;
  references: string[];
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}

const OWASP_DATA: Record<string, OWASPRecommendation[]> = {
  node: [
    { category: "A01:2021 – Broken Access Control", risk: "Users can access resources beyond their permissions", recommendation: "Implement role-based access control (RBAC) and validate permissions server-side on every request", references: ["https://owasp.org/Top10/A01_2021-Broken_Access_Control/"], severity: "HIGH" },
    { category: "A02:2021 – Cryptographic Failures", risk: "Sensitive data exposed due to weak encryption", recommendation: "Use bcrypt or argon2 for password hashing; enforce TLS 1.3; never store secrets in code", references: ["https://owasp.org/Top10/A02_2021-Cryptographic_Failures/"], severity: "HIGH" },
    { category: "A03:2021 – Injection", risk: "SQL, NoSQL, or command injection via untrusted input", recommendation: "Use parameterized queries, ORM sanitization, and input validation libraries like zod or joi", references: ["https://owasp.org/Top10/A03_2021-Injection/"], severity: "CRITICAL" },
    { category: "A06:2021 – Vulnerable Components", risk: "Outdated dependencies with known CVEs", recommendation: "Run npm audit regularly, enable Dependabot or Renovate, and review licenses", references: ["https://owasp.org/Top10/A06_2021-Vulnerable_Components/"], severity: "HIGH" },
    { category: "A07:2021 – Identification & Authentication Failures", risk: "Weak auth mechanisms allow account takeover", recommendation: "Enforce multi-factor authentication, rate-limit login attempts, and use secure session management", references: ["https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/"], severity: "CRITICAL" },
  ],
  python: [
    { category: "A01:2021 – Broken Access Control", risk: "Mass assignment vulnerabilities in Django/Flask", recommendation: "Use Django REST Framework permissions and serializers with explicit fields", references: ["https://owasp.org/Top10/A01_2021-Broken_Access_Control/"], severity: "HIGH" },
    { category: "A03:2021 – Injection", risk: "SQL injection via raw queries or ORM misuse", recommendation: "Use Django ORM or SQLAlchemy with parameterized queries; never use f-strings in SQL", references: ["https://owasp.org/Top10/A03_2021-Injection/"], severity: "CRITICAL" },
    { category: "A06:2021 – Vulnerable Components", risk: "Known CVEs in PyPI dependencies", recommendation: "Use pip-audit or safety in CI; pin versions and review pip-audit reports", references: ["https://owasp.org/Top10/A06_2021-Vulnerable_Components/"], severity: "HIGH" },
    { category: "A08:2021 – Software & Data Integrity Failures", risk: "Unverified dependencies from PyPI without hash pinning", recommendation: "Use pip hashes, sign packages, and verify checksums in requirements files", references: ["https://owasp.org/Top10/A08_2021-Software_and_Data_Integrity_Failures/"], severity: "MEDIUM" },
  ],
  go: [
    { category: "A01:2021 – Broken Access Control", risk: "Missing authorization middleware in Go HTTP handlers", recommendation: "Implement middleware-based auth checks and use RBAC libraries like casbin", references: ["https://owasp.org/Top10/A01_2021-Broken_Access_Control/"], severity: "HIGH" },
    { category: "A06:2021 – Vulnerable Components", risk: "Known CVEs in Go modules", recommendation: "Use govulncheck in CI and regularly update Go modules", references: ["https://owasp.org/Top10/A06_2021-Vulnerable_Components/"], severity: "HIGH" },
    { category: "A10:2021 – Server-Side Request Forgery", risk: "Unvalidated URLs in http.Get called with user input", recommendation: "Validate and sanitize all URLs; restrict outbound traffic with a network policy", references: ["https://owasp.org/Top10/A10_2021-Server-Side_Request_Forgery/"], severity: "HIGH" },
  ],
};

const SEVERITY_BADGE: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: "bg-red-600/10", text: "text-red-400", border: "border-red-600/20" },
  high: { bg: "bg-orange-600/10", text: "text-orange-400", border: "border-orange-600/20" },
  medium: { bg: "bg-yellow-600/10", text: "text-yellow-400", border: "border-yellow-600/20" },
  low: { bg: "bg-blue-600/10", text: "text-blue-400", border: "border-blue-600/20" },
  none: { bg: "bg-green-600/10", text: "text-green-400", border: "border-green-600/20" },
  CRITICAL: { bg: "bg-red-600/10", text: "text-red-400", border: "border-red-600/20" },
  HIGH: { bg: "bg-orange-600/10", text: "text-orange-400", border: "border-orange-600/20" },
  MEDIUM: { bg: "bg-yellow-600/10", text: "text-yellow-400", border: "border-yellow-600/20" },
  LOW: { bg: "bg-blue-600/10", text: "text-blue-400", border: "border-blue-600/20" },
};

function SeverityBadge({ severity, label }: { severity: string; label?: string }) {
  const s = SEVERITY_BADGE[severity] || SEVERITY_BADGE.low;
  return (
    <Badge className={`${s.bg} ${s.text} ${s.border} border`}>
      {label || severity}
    </Badge>
  );
}

function SecurityScoreRing({ score }: { score: number }) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(score / 100, 1);
  const strokeDashoffset = circumference * (1 - percentage);

  let color = "#22c55e";
  let label = "Good";
  if (score < 40) { color = "#ef4444"; label = "Critical"; }
  else if (score < 60) { color = "#f97316"; label = "Poor"; }
  else if (score < 80) { color = "#eab308"; label = "Fair"; }

  return (
    <div className="relative flex h-[120px] w-[120px] items-center justify-center">
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 110 110">
        <circle
          cx="55" cy="55" r={radius}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"
        />
        <motion.circle
          cx="55" cy="55" r={radius}
          fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <motion.div
        className="text-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
      >
        <p className="text-3xl font-bold text-white">{score}</p>
        <p className="text-xs text-zinc-500">{label}</p>
      </motion.div>
    </div>
  );
}

function DependencyScanTab() {
  const [packageJson, setPackageJson] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);

  const scan = async () => {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(packageJson);
    } catch {
      setError("Invalid JSON. Paste a valid package.json content.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dependencies: (parsed.dependencies || {}) as Record<string, string>,
          devDependencies: (parsed.devDependencies || {}) as Record<string, string>,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Scan failed");
      }
      const data: ScanResult = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to scan dependencies");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">Paste your package.json to scan for known vulnerabilities</p>
        <Button onClick={scan} disabled={loading || !packageJson.trim()}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Package className="mr-2 h-4 w-4" />}
          Scan Dependencies
        </Button>
      </div>

      <textarea
        value={packageJson}
        onChange={(e) => setPackageJson(e.target.value)}
        placeholder={`{\n  "dependencies": {\n    "express": "^4.18.0",\n    "lodash": "^4.17.20"\n  },\n  "devDependencies": {}\n}`}
        className="w-full h-48 rounded-lg border border-zinc-800 bg-black/60 p-4 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        spellCheck={false}
      />

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-600/20 bg-red-600/10 p-4">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Badge variant="secondary">Total: {result.summary.total}</Badge>
            {result.summary.critical > 0 && <SeverityBadge severity="critical" label={`Critical: ${result.summary.critical}`} />}
            {result.summary.high > 0 && <SeverityBadge severity="high" label={`High: ${result.summary.high}`} />}
            {result.summary.medium > 0 && <SeverityBadge severity="medium" label={`Medium: ${result.summary.medium}`} />}
            {result.summary.low > 0 && <SeverityBadge severity="low" label={`Low: ${result.summary.low}`} />}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-zinc-400">
                  <th className="pb-3 pr-4 font-medium">Package</th>
                  <th className="pb-3 pr-4 font-medium">Version</th>
                  <th className="pb-3 pr-4 font-medium">Severity</th>
                  <th className="pb-3 pr-4 font-medium">CVE</th>
                  <th className="pb-3 font-medium">Fix Version</th>
                </tr>
              </thead>
              <tbody>
                {result.findings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500">
                      <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-emerald-400" />
                      No vulnerabilities found
                    </td>
                  </tr>
                ) : (
                  result.findings.map((f) => (
                    <tr key={f.id} className="border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/30">
                      <td className="py-3 pr-4 text-white font-medium">{f.package}</td>
                      <td className="py-3 pr-4 text-zinc-300 font-mono text-xs">{f.version}</td>
                      <td className="py-3 pr-4"><SeverityBadge severity={f.severity} /></td>
                      <td className="py-3 pr-4 text-zinc-300 font-mono text-xs">{f.cve}</td>
                      <td className="py-3 text-emerald-400 font-mono text-xs">{f.fixVersion}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!result && !loading && !error && (
        <div className="text-center py-12 text-zinc-500">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>Paste your package.json and click "Scan Dependencies"</p>
        </div>
      )}
    </div>
  );
}

function SecretDetectionTab() {
  const [content, setContent] = useState("");
  const [filename, setFilename] = useState("file.ts");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SecretScanResult | null>(null);

  const scan = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/security/secrets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, filename }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Scan failed");
      }
      const data: SecretScanResult = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to scan for secrets");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          placeholder="filename.ts"
          className="flex-1"
        />
        <Button onClick={scan} disabled={loading || !content.trim()}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
          Scan for Secrets
        </Button>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Paste code to scan for hardcoded secrets, API keys, tokens..."
        className="w-full h-48 rounded-lg border border-zinc-800 bg-black/60 p-4 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        spellCheck={false}
      />

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-600/20 bg-red-600/10 p-4">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <SeverityBadge severity={result.total > 0 ? "critical" : "none"} label={`${result.total} secret${result.total !== 1 ? "s" : ""} found`} />
          </div>
          <div className="space-y-3">
            {result.findings.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-emerald-400" />
                <p>No secrets detected</p>
              </div>
            ) : (
              result.findings.map((f) => (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-red-600/20 bg-red-600/5 p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={f.severity} />
                      <span className="text-sm font-medium text-white">{f.type}</span>
                    </div>
                    <span className="text-xs text-zinc-500 font-mono">{f.filePath}:{f.lineNumber}</span>
                  </div>
                  <p className="text-sm text-zinc-300">{f.description}</p>
                  {f.codeSnippet && (
                    <pre className="text-xs text-zinc-400 font-mono bg-black/40 rounded p-2 overflow-x-auto">
                      <code>{f.codeSnippet}</code>
                    </pre>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}

      {!result && !loading && !error && (
        <div className="text-center py-12 text-zinc-500">
          <Eye className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>Paste code to scan for hardcoded secrets and credentials</p>
        </div>
      )}
    </div>
  );
}

function ContainerScanTab() {
  const [imageName, setImageName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ContainerScanResult | null>(null);

  const scan = async () => {
    if (!imageName.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/security/container-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageName }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Container scan failed");
      }
      const data: ContainerScanResult = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to scan container image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input
          value={imageName}
          onChange={(e) => setImageName(e.target.value)}
          placeholder="node:20, python:3.12, nginx:latest..."
          className="flex-1"
        />
        <Button onClick={scan} disabled={loading || !imageName.trim()}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
          Scan
        </Button>
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-600/20 bg-red-600/10 p-4">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-medium text-white">{result.image}</h4>
                <p className="text-xs text-zinc-500 font-mono">{result.imageDigest.slice(0, 20)}...</p>
                <p className="text-xs text-zinc-500">{result.os.family} {result.os.version}</p>
              </div>
              <div className="flex gap-1">
                {result.criticalCount > 0 && <SeverityBadge severity="CRITICAL" label={`${result.criticalCount} C`} />}
                {result.highCount > 0 && <SeverityBadge severity="HIGH" label={`${result.highCount} H`} />}
                {result.mediumCount > 0 && <SeverityBadge severity="MEDIUM" label={`${result.mediumCount} M`} />}
                {result.lowCount > 0 && <SeverityBadge severity="LOW" label={`${result.lowCount} L`} />}
              </div>
            </div>
          </div>

          {result.vulnerabilities.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-emerald-400" />
              <p>No vulnerabilities found in this image</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-left text-zinc-400">
                    <th className="pb-3 pr-4 font-medium">Package</th>
                    <th className="pb-3 pr-4 font-medium">Severity</th>
                    <th className="pb-3 pr-4 font-medium">CVE</th>
                    <th className="pb-3 pr-4 font-medium">Fix Version</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.vulnerabilities.map((v) => (
                    <tr key={v.id} className="border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/30">
                      <td className="py-3 pr-4">
                        <span className="text-white text-xs">{v.packageName}</span>
                        <span className="text-zinc-500 text-xs ml-1">{v.packageVersion}</span>
                      </td>
                      <td className="py-3 pr-4"><SeverityBadge severity={v.severity} /></td>
                      <td className="py-3 pr-4 text-zinc-300 font-mono text-xs">{v.cvssScore > 0 ? `${v.cveId} (${v.cvssScore})` : v.cveId}</td>
                      <td className="py-3 text-emerald-400 font-mono text-xs">{v.fixVersion}</td>
                      <td className="py-3"><Badge variant="outline" className="text-xs">{v.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!result && !loading && !error && (
        <div className="text-center py-12 text-zinc-500">
          <Container className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>Enter a container image name and click "Scan"</p>
        </div>
      )}
    </div>
  );
}

function OWASPTab() {
  const [tech, setTech] = useState("node");

  const recommendations = OWASP_DATA[tech] || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={tech} onValueChange={setTech}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="node">Node.js</SelectItem>
            <SelectItem value="python">Python</SelectItem>
            <SelectItem value="go">Go</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {recommendations.length > 0 ? (
        <div className="space-y-4">
          {recommendations.map((rec, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-lg border border-zinc-800 p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={rec.severity} />
                  <h4 className="text-sm font-medium text-white">{rec.category}</h4>
                </div>
              </div>
              <p className="text-sm text-zinc-400">
                <span className="text-zinc-500">Risk: </span>{rec.risk}
              </p>
              <div className="flex items-start gap-2 text-sm text-zinc-300">
                <ArrowRight className="h-4 w-4 mt-0.5 shrink-0 text-emerald-400" />
                <span>{rec.recommendation}</span>
              </div>
              {rec.references.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {rec.references.map((ref, j) => (
                    <a
                      key={j}
                      href={ref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Reference
                    </a>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-zinc-500">
          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>Select a technology to see OWASP Top 10 recommendations</p>
        </div>
      )}
    </div>
  );
}

export function SecurityDashboardClient() {
  const [activeTab, setActiveTab] = useState("dependency-scan");

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Security Center</h1>
            <p className="text-zinc-400">Vulnerability scanning, secret detection, and security recommendations</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <SecurityScoreRing score={85} />
              <p className="text-sm text-zinc-400 mt-2">Security Score</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-zinc-400">Total Findings</p>
                <p className="text-2xl font-bold text-white">12</p>
              </div>
              <div className="rounded-lg bg-zinc-600/10 p-3">
                <Shield className="h-5 w-5 text-zinc-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-zinc-400">Critical</p>
                <p className="text-2xl font-bold text-red-400">3</p>
              </div>
              <div className="rounded-lg bg-red-600/10 p-3">
                <ShieldAlert className="h-5 w-5 text-red-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-zinc-400">High</p>
                <p className="text-2xl font-bold text-orange-400">5</p>
              </div>
              <div className="rounded-lg bg-orange-600/10 p-3">
                <AlertTriangle className="h-5 w-5 text-orange-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-zinc-400">Medium / Low</p>
                <p className="text-2xl font-bold text-white">4</p>
              </div>
              <div className="rounded-lg bg-yellow-600/10 p-3">
                <Bug className="h-5 w-5 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-rose-400" />
              Security Tools
            </CardTitle>
            <CardDescription>
              Run security scans and get OWASP recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="dependency-scan">
                  <Package className="mr-2 h-4 w-4" />
                  Dependency Scan
                </TabsTrigger>
                <TabsTrigger value="secret-detection">
                  <Eye className="mr-2 h-4 w-4" />
                  Secret Detection
                </TabsTrigger>
                <TabsTrigger value="container-scan">
                  <Container className="mr-2 h-4 w-4" />
                  Container Scan
                </TabsTrigger>
                <TabsTrigger value="owasp">
                  <BookOpen className="mr-2 h-4 w-4" />
                  OWASP
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dependency-scan">
                <DependencyScanTab />
              </TabsContent>

              <TabsContent value="secret-detection">
                <SecretDetectionTab />
              </TabsContent>

              <TabsContent value="container-scan">
                <ContainerScanTab />
              </TabsContent>

              <TabsContent value="owasp">
                <OWASPTab />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
}
