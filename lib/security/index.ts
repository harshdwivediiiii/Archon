import * as crypto from "node:crypto";
import {
  Vulnerability,
  SecretFinding,
  ContainerVulnerability,
  OWASPRecommendation,
  LicenseInfo,
  SecuritySeverity,
} from "@/types/platform";

export type VulnerabilitySeverity = "critical" | "high" | "medium" | "low" | "none";

export interface SecurityFinding {
  id: string;
  package: string;
  version: string;
  severity: VulnerabilitySeverity;
  description: string;
  cve: string;
  fixVersion: string;
  source: string;
}

export interface ScanSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  none: number;
}

export interface ScanResult {
  summary: ScanSummary;
  findings: SecurityFinding[];
  scanTime: string;
}

export interface DependencyScanRequest {
  dependencies: Record<string, string>;
  devDependencies?: Record<string, string>;
  deep?: boolean;
}

const VULN_DATABASE: Array<{
  package: string;
  versions: string[];
  severity: VulnerabilitySeverity;
  description: string;
  cve: string;
  fixVersion: string;
}> = [
  {
    package: "lodash",
    versions: ["<4.17.21"],
    severity: "high",
    description: "Prototype pollution in lodash allows attackers to modify object properties",
    cve: "CVE-2024-31268",
    fixVersion: "4.17.21",
  },
  {
    package: "express",
    versions: ["<4.19.2"],
    severity: "medium",
    description: "Open redirect vulnerability in Express.js",
    cve: "CVE-2024-29041",
    fixVersion: "4.19.2",
  },
  {
    package: "axios",
    versions: ["<1.7.2"],
    severity: "high",
    description: "Server-Side Request Forgery (SSRF) in axios",
    cve: "CVE-2024-39338",
    fixVersion: "1.7.2",
  },
  {
    package: "next",
    versions: ["<14.2.21", "<15.2.3", ">=15.0.0 <15.2.3"],
    severity: "critical",
    description: "Server-Side Denial of Service in Next.js",
    cve: "CVE-2025-29927",
    fixVersion: "14.2.21 / 15.2.3",
  },
  {
    package: "prisma",
    versions: ["<5.22.0"],
    severity: "medium",
    description: "Prisma ORM raw query injection via $queryRawUnsafe",
    cve: "CVE-2024-6455",
    fixVersion: "5.22.0",
  },
  {
    package: "jsonwebtoken",
    versions: ["<9.0.2"],
    severity: "high",
    description: "Remote code execution via crafted JWT tokens",
    cve: "CVE-2024-28849",
    fixVersion: "9.0.2",
  },
  {
    package: "mongoose",
    versions: ["<8.4.1"],
    severity: "high",
    description: "Prototype pollution in Mongoose schema handling",
    cve: "CVE-2024-53900",
    fixVersion: "8.4.1",
  },
  {
    package: "undici",
    versions: ["<6.19.2"],
    severity: "high",
    description: "HTTP request smuggling in undici",
    cve: "CVE-2024-30260",
    fixVersion: "6.19.2",
  },
  {
    package: "socket.io",
    versions: ["<4.7.5"],
    severity: "medium",
    description: "Unhandled exception during socket.io handshake",
    cve: "CVE-2024-38355",
    fixVersion: "4.7.5",
  },
  {
    package: "react",
    versions: ["<18.3.1"],
    severity: "low",
    description: "Cross-site scripting via dangerouslySetInnerHTML in React",
    cve: "CVE-2024-31951",
    fixVersion: "18.3.1",
  },
];

function satisfiesVersionConstraint(
  version: string,
  constraint: string
): boolean {
  if (constraint.startsWith("<")) {
    const target = parseVersion(constraint.slice(1));
    const actual = parseVersion(stripRange(version));
    if (!target || !actual) return false;
    for (let i = 0; i < 3; i++) {
      const a = actual[i] ?? 0;
      const t = target[i] ?? 0;
      if (a < t) return true;
      if (a > t) return false;
    }
    return false;
  }

  if (constraint.startsWith(">=")) {
    const target = parseVersion(constraint.slice(2));
    const actual = parseVersion(stripRange(version));
    if (!target || !actual) return false;
    for (let i = 0; i < 3; i++) {
      const a = actual[i] ?? 0;
      const t = target[i] ?? 0;
      if (a > t) return true;
      if (a < t) return false;
    }
    return true;
  }

  if (constraint.includes(" ")) {
    const parts = constraint.split(/\s+/);
    return parts.every((p) => satisfiesVersionConstraint(version, p));
  }

  if (constraint.startsWith(">") && constraint[1] !== "=") {
    const target = parseVersion(constraint.slice(1));
    const actual = parseVersion(stripRange(version));
    if (!target || !actual) return false;
    for (let i = 0; i < 3; i++) {
      const a = actual[i] ?? 0;
      const t = target[i] ?? 0;
      if (a > t) return true;
      if (a < t) return false;
    }
    return false;
  }

  return false;
}

function parseVersion(v: string): number[] | null {
  const clean = v.replace(/[^0-9.]/g, "");
  const parts = clean.split(".").map(Number);
  if (parts.some(isNaN)) return null;
  return parts;
}

function stripRange(v: string): string {
  return v.replace(/^[\^~>=<]/, "");
}

function isVersionAffected(
  version: string,
  affectedVersions: string[]
): boolean {
  return affectedVersions.some((v) => satisfiesVersionConstraint(version, v));
}

export function scanDependencies(packageJson: object): ScanResult {
  const now = new Date().toISOString();
  const findings: SecurityFinding[] = [];
  let idCounter = 0;

  const deps: Record<string, string> = {};
  const pkg = packageJson as Record<string, unknown>;

  if (pkg.dependencies && typeof pkg.dependencies === "object") {
    Object.assign(deps, pkg.dependencies as Record<string, string>);
  }
  if (pkg.devDependencies && typeof pkg.devDependencies === "object") {
    Object.assign(deps, pkg.devDependencies as Record<string, string>);
  }

  for (const [name, version] of Object.entries(deps)) {
    for (const vuln of VULN_DATABASE) {
      if (vuln.package === name && isVersionAffected(version, vuln.versions)) {
        findings.push({
          id: `${name}-${++idCounter}`,
          package: name,
          version,
          severity: vuln.severity,
          description: vuln.description,
          cve: vuln.cve,
          fixVersion: vuln.fixVersion,
          source: "archon-simulated",
        });
      }
    }
  }

  const summary: ScanSummary = {
    total: findings.length,
    critical: findings.filter((f) => f.severity === "critical").length,
    high: findings.filter((f) => f.severity === "high").length,
    medium: findings.filter((f) => f.severity === "medium").length,
    low: findings.filter((f) => f.severity === "low").length,
    none: findings.filter((f) => f.severity === "none").length,
  };

  return { summary, findings, scanTime: now };
}

const SECRET_PATTERNS: Array<{
  regex: RegExp;
  type: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  description: string;
}> = [
  {
    regex: /(?:password|passwd|pwd)\s*[=:]\s*["'][^"'\s]{4,}["']/i,
    type: "PASSWORD",
    severity: "CRITICAL",
    description: "Hardcoded password detected",
  },
  {
    regex: /(?:api[_-]?key|apikey)\s*[=:]\s*["'][^"'\s]{8,}["']/i,
    type: "API_KEY",
    severity: "CRITICAL",
    description: "Hardcoded API key detected",
  },
  {
    regex: /(?:secret|secret_key)\s*[=:]\s*["'][^"'\s]{8,}["']/i,
    type: "SECRET",
    severity: "HIGH",
    description: "Hardcoded secret detected",
  },
  {
    regex: /(?:token|auth_token|access_token)\s*[=:]\s*["'][^"'\s]{8,}["']/i,
    type: "TOKEN",
    severity: "HIGH",
    description: "Hardcoded authentication token detected",
  },
  {
    regex: /(?:private_key|privatekey|ssh-private)\s*[=:]\s*["']/i,
    type: "PRIVATE_KEY",
    severity: "CRITICAL",
    description: "Hardcoded private key detected",
  },
  {
    regex: /(?:ghp_|gho_|ghu_|ghs_|ghr_)[A-Za-z0-9]{36}/,
    type: "GITHUB_TOKEN",
    severity: "CRITICAL",
    description: "Hardcoded GitHub token detected",
  },
  {
    regex: /(?:sk-[A-Za-z0-9]{20,})/,
    type: "OPENAI_KEY",
    severity: "HIGH",
    description: "Hardcoded OpenAI API key detected",
  },
  {
    regex: /(?:mongodb|postgresql|mysql|redis):\/\/[^@]+@/i,
    type: "CONNECTION_STRING",
    severity: "HIGH",
    description: "Database connection string with embedded credentials",
  },
  {
    regex: /(?:AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY)\s*[=:]\s*["'][^"'\s]+["']/i,
    type: "AWS_CREDENTIAL",
    severity: "CRITICAL",
    description: "Hardcoded AWS credential detected",
  },
  {
    regex: /(?:stripe|sk_live|pk_live|sk_test|pk_test)_[A-Za-z0-9]+/i,
    type: "STRIPE_KEY",
    severity: "CRITICAL",
    description: "Hardcoded Stripe API key detected",
  },
  {
    regex: /(?:BEGIN\s+(?:RSA|DSA|EC|OPENSSH|PGP)\s+PRIVATE\s+KEY)/i,
    type: "PRIVATE_KEY_BLOCK",
    severity: "CRITICAL",
    description: "Private key block detected in source code",
  },
  {
    regex: /(?:jwt_secret|jwtsecret|jwt-secret)\s*[=:]\s*["'][^"'\s]{4,}["']/i,
    type: "JWT_SECRET",
    severity: "CRITICAL",
    description: "Hardcoded JWT secret detected",
  },
  {
    regex: /(?:slack_token|discord_token|telegram_token|bot_token)\s*[=:]\s*["'][^"'\s]+["']/i,
    type: "BOT_TOKEN",
    severity: "HIGH",
    description: "Hardcoded chat bot token detected",
  },
];

const IGNORED_PATHS = [
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "coverage",
  ".venv",
  "__pycache__",
  ".terraform",
];

function isIgnoredPath(filepath: string): boolean {
  return IGNORED_PATHS.some((p) => filepath.includes(p));
}

export function scanForSecrets(
  content: string,
  filename: string
): SecretFinding[] {
  if (isIgnoredPath(filename)) return [];

  const findings: SecretFinding[] = [];
  const lines = content.split("\n");
  const isEnvFile =
    filename.endsWith(".env") || filename.endsWith(".env.example");

  for (const pattern of SECRET_PATTERNS) {
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i]!.match(pattern.regex);
      if (match) {
        if (isEnvFile) continue;

        findings.push({
          id: crypto.randomUUID(),
          type: pattern.type,
          description: pattern.description,
          severity: pattern.severity as SecuritySeverity,
          filePath: filename,
          lineNumber: i + 1,
          codeSnippet: lines[i]!.substring(0, 120).replace(
            match[0],
            match[0].substring(0, 8) + "***REDACTED***"
          ),
          detectedAt: new Date().toISOString(),
          isValidated: false,
        });
      }
    }
  }

  return findings;
}

const MOCK_CONTAINER_VULNS: Record<
  string,
  ContainerVulnerability["vulnerabilities"]
> = {
  "node:20": [
    {
      id: "CVE-2024-1234",
      source: "trivy",
      title: "OpenSSL heap buffer overflow",
      description: "Heap buffer overflow in OpenSSL during TLS handshake",
      severity: "HIGH",
      cvssScore: 7.5,
      cvssVector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H",
      cveId: "CVE-2024-1234",
      packageName: "openssl",
      packageVersion: "3.0.12",
      fixVersion: "3.0.13",
      publishedAt: "2024-06-01T00:00:00Z",
      detectedAt: new Date().toISOString(),
      status: "open",
    },
    {
      id: "CVE-2024-5678",
      source: "trivy",
      title: "cURL cookie injection",
      description: "cURL vulnerable to cookie injection via malicious server",
      severity: "MEDIUM",
      cvssScore: 5.3,
      cveId: "CVE-2024-5678",
      packageName: "curl",
      packageVersion: "8.6.0",
      fixVersion: "8.7.1",
      publishedAt: "2024-05-15T00:00:00Z",
      detectedAt: new Date().toISOString(),
      status: "open",
    },
  ],
  "python:3.12": [
    {
      id: "CVE-2024-9012",
      source: "grype",
      title: "Python tarfile directory traversal",
      description:
        "Python tarfile module allows directory traversal via symlinks",
      severity: "HIGH",
      cvssScore: 7.2,
      cvssVector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:H/I:N/A:N",
      cveId: "CVE-2024-9012",
      packageName: "python",
      packageVersion: "3.12.2",
      fixVersion: "3.12.3",
      publishedAt: "2024-04-20T00:00:00Z",
      detectedAt: new Date().toISOString(),
      status: "open",
    },
  ],
};

export function analyzeContainerImage(
  imageName: string
): ContainerVulnerability[] {
  const normalized = imageName.toLowerCase();

  const results: ContainerVulnerability[] = [];

  for (const [base, vulns] of Object.entries(MOCK_CONTAINER_VULNS)) {
    if (normalized.includes(base)) {
      results.push({
        image: imageName,
        imageDigest: `sha256:${crypto.randomBytes(32).toString("hex")}`,
        os: {
          family: base.startsWith("node") ? "debian" : "ubuntu",
          version: base.startsWith("node") ? "12 (bookworm)" : "24.04",
        },
        vulnerabilities: vulns,
        score: Math.max(...vulns.map((v) => v.cvssScore ?? 0)),
        highCount: vulns.filter((v) => v.severity === "HIGH").length,
        mediumCount: vulns.filter((v) => v.severity === "MEDIUM").length,
        lowCount: vulns.filter((v) => v.severity === "LOW").length,
        criticalCount: vulns.filter((v) => v.severity === "CRITICAL").length,
        scannedAt: new Date().toISOString(),
      });
    }
  }

  if (results.length === 0) {
    results.push({
      image: imageName,
      imageDigest: `sha256:${crypto.randomBytes(32).toString("hex")}`,
      os: { family: "unknown", version: "unknown" },
      vulnerabilities: [],
      score: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      criticalCount: 0,
      scannedAt: new Date().toISOString(),
    });
  }

  return results;
}

export function getSecurityScore(
  findings: SecurityFinding[]
): {
  score: number;
  level: "good" | "fair" | "poor" | "critical";
  breakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    none: number;
    maxSeverity: string;
  };
} {
  const critical = findings.filter((f) => f.severity === "critical").length;
  const high = findings.filter((f) => f.severity === "high").length;
  const medium = findings.filter((f) => f.severity === "medium").length;
  const low = findings.filter((f) => f.severity === "low").length;
  const none = findings.filter((f) => f.severity === "none").length;

  const total = findings.length;

  const weights = { critical: 40, high: 20, medium: 10, low: 3, none: 0 };
  const rawScore =
    critical * weights.critical +
    high * weights.high +
    medium * weights.medium +
    low * weights.low;

  const maxPossible = total * weights.critical || 1;
  const normalizedScore = Math.max(0, 100 - (rawScore / maxPossible) * 100);

  let level: "good" | "fair" | "poor" | "critical";
  if (normalizedScore >= 80) level = "good";
  else if (normalizedScore >= 60) level = "fair";
  else if (normalizedScore >= 40) level = "poor";
  else level = "critical";

  const severities = ["critical", "high", "medium", "low", "none"] as const;
  const maxSeverity =
    severities.find((s) => findings.some((f) => f.severity === s)) ?? "none";

  return {
    score: Math.round(normalizedScore),
    level,
    breakdown: { critical, high, medium, low, none, maxSeverity },
  };
}

const OWASP_RECOMMENDATIONS: Record<string, OWASPRecommendation[]> = {
  node: [
    {
      category: "A01:2021 – Broken Access Control",
      risk: "Users can access resources beyond their permissions",
      recommendation:
        "Implement role-based access control (RBAC) and validate permissions server-side on every request",
      references: ["https://owasp.org/Top10/A01_2021-Broken_Access_Control/"],
      severity: "HIGH",
    },
    {
      category: "A02:2021 – Cryptographic Failures",
      risk: "Sensitive data exposed due to weak encryption",
      recommendation:
        "Use bcrypt or argon2 for password hashing; enforce TLS 1.3; never store secrets in code",
      references: ["https://owasp.org/Top10/A02_2021-Cryptographic_Failures/"],
      severity: "HIGH",
    },
    {
      category: "A03:2021 – Injection",
      risk: "SQL, NoSQL, or command injection via untrusted input",
      recommendation:
        "Use parameterized queries, ORM sanitization, and input validation libraries like zod or joi",
      references: ["https://owasp.org/Top10/A03_2021-Injection/"],
      severity: "CRITICAL",
    },
    {
      category: "A06:2021 – Vulnerable Components",
      risk: "Outdated dependencies with known CVEs",
      recommendation:
        "Run `npm audit` regularly, enable Dependabot or Renovate, and review licenses",
      references: ["https://owasp.org/Top10/A06_2021-Vulnerable_Components/"],
      severity: "HIGH",
    },
    {
      category: "A07:2021 – Identification & Authentication Failures",
      risk: "Weak auth mechanisms allow account takeover",
      recommendation:
        "Enforce multi-factor authentication, rate-limit login attempts, and use secure session management",
      references: [
        "https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/",
      ],
      severity: "CRITICAL",
    },
  ],
  python: [
    {
      category: "A01:2021 – Broken Access Control",
      risk: "Mass assignment vulnerabilities in Django/Flask",
      recommendation:
        "Use Django REST Framework permissions and serializers with explicit fields",
      references: ["https://owasp.org/Top10/A01_2021-Broken_Access_Control/"],
      severity: "HIGH",
    },
    {
      category: "A03:2021 – Injection",
      risk: "SQL injection via raw queries or ORM misuse",
      recommendation:
        "Use Django ORM or SQLAlchemy with parameterized queries; never use f-strings in SQL",
      references: ["https://owasp.org/Top10/A03_2021-Injection/"],
      severity: "CRITICAL",
    },
    {
      category: "A06:2021 – Vulnerable Components",
      risk: "Known CVEs in PyPI dependencies",
      recommendation:
        "Use `pip-audit` or `safety` in CI; pin versions and review `pip-audit` reports",
      references: ["https://owasp.org/Top10/A06_2021-Vulnerable_Components/"],
      severity: "HIGH",
    },
    {
      category: "A08:2021 – Software & Data Integrity Failures",
      risk: "Unverified dependencies from PyPI without hash pinning",
      recommendation:
        "Use pip hashes, sign packages, and verify checksums in requirements files",
      references: [
        "https://owasp.org/Top10/A08_2021-Software_and_Data_Integrity_Failures/",
      ],
      severity: "MEDIUM",
    },
  ],
  go: [
    {
      category: "A01:2021 – Broken Access Control",
      risk: "Missing authorization middleware in Go HTTP handlers",
      recommendation:
        "Implement middleware-based auth checks and use RBAC libraries like casbin",
      references: ["https://owasp.org/Top10/A01_2021-Broken_Access_Control/"],
      severity: "HIGH",
    },
    {
      category: "A06:2021 – Vulnerable Components",
      risk: "Known CVEs in Go modules",
      recommendation:
        "Use `govulncheck` in CI and regularly update Go modules",
      references: ["https://owasp.org/Top10/A06_2021-Vulnerable_Components/"],
      severity: "HIGH",
    },
    {
      category: "A10:2021 – Server-Side Request Forgery",
      risk: "Unvalidated URLs in `http.Get` called with user input",
      recommendation:
        "Validate and sanitize all URLs; restrict outbound traffic with a network policy",
      references: ["https://owasp.org/Top10/A10_2021-Server-Side_Request_Forgery/"],
      severity: "HIGH",
    },
  ],
};

export function getOWASPRecommendations(
  tech: string
): OWASPRecommendation[] {
  const key = tech.toLowerCase();
  if (OWASP_RECOMMENDATIONS[key]) return OWASP_RECOMMENDATIONS[key]!;

  return [
    {
      category: "A06:2021 – Vulnerable Components",
      risk: "Outdated dependencies with known CVEs",
      recommendation:
        "Use dependency scanning tools (Snyk, Dependabot, Trivy) to detect and patch vulnerable components",
      references: ["https://owasp.org/Top10/A06_2021-Vulnerable_Components/"],
      severity: "HIGH",
    },
  ];
}

const LICENSE_DATABASE: Record<string, LicenseInfo> = {
  MIT: {
    name: "MIT License",
    spdxId: "MIT",
    osiApproved: true,
    url: "https://opensource.org/licenses/MIT",
    permissions: ["Commercial use", "Modification", "Distribution", "Private use"],
    conditions: ["Include copyright notice", "Include license notice"],
    limitations: ["Liability", "Warranty"],
  },
  "Apache-2.0": {
    name: "Apache License 2.0",
    spdxId: "Apache-2.0",
    osiApproved: true,
    url: "https://opensource.org/licenses/Apache-2.0",
    permissions: ["Commercial use", "Modification", "Distribution", "Patent use", "Private use"],
    conditions: ["Include copyright notice", "Include license notice", "State changes"],
    limitations: ["Liability", "Trademark use", "Warranty"],
  },
  GPL: {
    name: "GNU General Public License v3.0",
    spdxId: "GPL-3.0-only",
    osiApproved: true,
    url: "https://opensource.org/licenses/GPL-3.0",
    permissions: ["Commercial use", "Modification", "Distribution", "Patent use", "Private use"],
    conditions: ["Disclose source", "Include copyright notice", "Include license notice", "State changes", "Same license"],
    limitations: ["Liability", "Warranty"],
  },
  "BSD-2-Clause": {
    name: "BSD 2-Clause License",
    spdxId: "BSD-2-Clause",
    osiApproved: true,
    url: "https://opensource.org/licenses/BSD-2-Clause",
    permissions: ["Commercial use", "Modification", "Distribution", "Private use"],
    conditions: ["Include copyright notice", "Include license notice"],
    limitations: ["Liability", "Warranty"],
  },
  "BSD-3-Clause": {
    name: "BSD 3-Clause License",
    spdxId: "BSD-3-Clause",
    osiApproved: true,
    url: "https://opensource.org/licenses/BSD-3-Clause",
    permissions: ["Commercial use", "Modification", "Distribution", "Private use"],
    conditions: ["Include copyright notice", "Include license notice"],
    limitations: ["Liability", "Warranty", "Trademark use"],
  },
  "MPL-2.0": {
    name: "Mozilla Public License 2.0",
    spdxId: "MPL-2.0",
    osiApproved: true,
    url: "https://opensource.org/licenses/MPL-2.0",
    permissions: ["Commercial use", "Modification", "Distribution", "Private use"],
    conditions: ["Disclose source (modified files)", "Include copyright notice", "Include license notice"],
    limitations: ["Liability", "Warranty", "Trademark use"],
  },
  "LGPL-3.0": {
    name: "GNU Lesser General Public License v3.0",
    spdxId: "LGPL-3.0-only",
    osiApproved: true,
    url: "https://opensource.org/licenses/LGPL-3.0",
    permissions: ["Commercial use", "Modification", "Distribution", "Private use"],
    conditions: ["Disclose source", "Include copyright notice", "Include license notice", "State changes", "Same license (library)"],
    limitations: ["Liability", "Warranty"],
  },
  Unlicense: {
    name: "The Unlicense",
    spdxId: "Unlicense",
    osiApproved: true,
    url: "https://unlicense.org/",
    permissions: ["Commercial use", "Modification", "Distribution", "Private use"],
    conditions: [],
    limitations: ["Liability", "Warranty"],
  },
  "AGPL-3.0": {
    name: "GNU Affero General Public License v3.0",
    spdxId: "AGPL-3.0-only",
    osiApproved: true,
    url: "https://opensource.org/licenses/AGPL-3.0",
    permissions: ["Commercial use", "Modification", "Distribution", "Patent use", "Private use"],
    conditions: ["Disclose source", "Include copyright notice", "Include license notice", "State changes", "Same license", "Network use is distribution"],
    limitations: ["Liability", "Warranty"],
  },
  ISC: {
    name: "ISC License",
    spdxId: "ISC",
    osiApproved: true,
    url: "https://opensource.org/licenses/ISC",
    permissions: ["Commercial use", "Modification", "Distribution", "Private use"],
    conditions: ["Include copyright notice", "Include license notice"],
    limitations: ["Liability", "Warranty"],
  },
};

export function checkLicense(licenseId: string): LicenseInfo {
  const normalized = licenseId.trim();
  const license = LICENSE_DATABASE[normalized];
  if (license) return license;

  return {
    name: `Unknown License (${normalized})`,
    spdxId: normalized,
    osiApproved: false,
    permissions: [],
    conditions: [],
    limitations: [],
  };
}

export function findExpiredDependencies(
  deps: Record<string, string>,
  daysOld: number
): Array<{ name: string; version: string; age: number; publishedAt: string }> {
  const now = Date.now();
  const cutoff = now - daysOld * 24 * 60 * 60 * 1000;
  const expired: Array<{
    name: string;
    version: string;
    age: number;
    publishedAt: string;
  }> = [];

  for (const [name, version] of Object.entries(deps)) {
    const publishedAt = simulatePublishDate(version);
    const age = Math.round(
      (now - publishedAt.getTime()) / (24 * 60 * 60 * 1000)
    );

    if (publishedAt.getTime() < cutoff) {
      expired.push({
        name,
        version,
        age,
        publishedAt: publishedAt.toISOString(),
      });
    }
  }

  const sorted = [...expired].sort((a, b) => b.age - a.age);
  return sorted;
}

function simulatePublishDate(version: string): Date {
  const hash = crypto.createHash("md5").update(version).digest("hex");
  const seed = parseInt(hash.slice(0, 8), 16);
  const daysAgo = 30 + (seed % 730);
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}
