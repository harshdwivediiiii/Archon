# Security Center

## Overview

Archon's security module provides a comprehensive security scanning and analysis suite for repositories, dependencies, containers, and source code. It simulates scans using a built-in vulnerability database and pattern-matching engine.

**Source**: `lib/security/index.ts` — 815 lines.

## Features

### 1. Dependency Scanning

**Source**: `lib/security/index.ts` — `scanDependencies()`

Scans a `package.json` file against a built-in vulnerability database (`VULN_DATABASE`) containing real CVEs for common packages:

| Package | CVE | Severity | Fix Version |
|---------|-----|----------|-------------|
| lodash | CVE-2024-31268 | high | 4.17.21 |
| express | CVE-2024-29041 | medium | 4.19.2 |
| axios | CVE-2024-39338 | high | 1.7.2 |
| next | CVE-2025-29927 | critical | 14.2.21 / 15.2.3 |
| prisma | CVE-2024-6455 | medium | 5.22.0 |
| jsonwebtoken | CVE-2024-28849 | high | 9.0.2 |
| mongoose | CVE-2024-53900 | high | 8.4.1 |
| undici | CVE-2024-30260 | high | 6.19.2 |
| socket.io | CVE-2024-38355 | medium | 4.7.5 |
| react | CVE-2024-31951 | low | 18.3.1 |

```typescript
import { scanDependencies } from "@/lib/security";

const result = scanDependencies({
  dependencies: { "lodash": "^4.17.20", "express": "^4.18.0" }
});
console.log(result.summary);  // { total: 1, critical: 0, high: 1, ... }
console.log(result.findings); // Array of SecurityFinding
```

### 2. Secret Detection

**Source**: `lib/security/index.ts` — `scanForSecrets()`

Regex-based secret scanning across 13 pattern types:

| Pattern Type | Severity | Example |
|-------------|----------|---------|
| Password | CRITICAL | `password = "secret123"` |
| API Key | CRITICAL | `api_key = "sk-abc..."` |
| Secret | HIGH | `secret = "topsecret"` |
| Token | HIGH | `auth_token = "eyJ..."` |
| Private Key | CRITICAL | `-----BEGIN RSA PRIVATE KEY-----` |
| GitHub Token | CRITICAL | `ghp_xxxxxxxxxxxxxxxxxxxx` |
| OpenAI Key | HIGH | `sk-xxxxxxxxxxxxxxxxxxxx` |
| Connection String | HIGH | `mongodb://user:pass@host` |
| AWS Credential | CRITICAL | `AWS_ACCESS_KEY_ID=AKIA...` |
| Stripe Key | CRITICAL | `sk_live_xxxxxxxxxxxxxx` |
| Private Key Block | CRITICAL | `BEGIN PRIVATE KEY` |
| JWT Secret | CRITICAL | `jwt_secret = "supersecret"` |
| Bot Token | HIGH | `slack_token = "xoxb..."` |

Ignores `.env` files (which are expected to contain secrets) and common non-source directories (`node_modules`, `.git`, `dist`, etc.).

```typescript
import { scanForSecrets } from "@/lib/security";

const findings = scanForSecrets(fileContent, "src/config.ts");
findings.forEach(f => {
  console.log(`${f.type} found at ${f.filePath}:${f.lineNumber}`);
});
```

### 3. Container Scanning

**Source**: `lib/security/index.ts` — `analyzeContainerImage()`

Simulates container image vulnerability analysis with mock data for base images (`node:20`, `python:3.12`). Returns structured vulnerability data per image layer including CVSS scores, package-level findings, and severity counts.

```typescript
import { analyzeContainerImage } from "@/lib/security";

const vulns = analyzeContainerImage("node:20");
console.log(vulns[0].criticalCount); // Number of critical vulnerabilities
console.log(vulns[0].vulnerabilities); // Detailed CVE entries
```

### 4. OWASP Recommendations

**Source**: `lib/security/index.ts` — `getOWASPRecommendations()`

Provides OWASP Top 10 (2021) recommendations tailored to the detected technology stack:

| Technology | Categories Covered |
|-----------|-------------------|
| Node.js | A01 (Access Control), A02 (Crypto), A03 (Injection), A06 (Components), A07 (Auth) |
| Python | A01, A03, A06, A08 (Integrity) |
| Go | A01, A06, A10 (SSRF) |

```typescript
import { getOWASPRecommendations } from "@/lib/security";

const recs = getOWASPRecommendations("node");
recs.forEach(r => {
  console.log(`${r.category}: ${r.recommendation}`);
});
```

### 5. License Checking

**Source**: `lib/security/index.ts` — `checkLicense()`

Built-in database of 10 common open-source licenses with permission/condition/limitation breakdown:

| License | OSI Approved | Has Copyleft |
|---------|-------------|--------------|
| MIT | Yes | No |
| Apache-2.0 | Yes | No |
| GPL-3.0 | Yes | Yes (strong) |
| BSD-2/3-Clause | Yes | No |
| MPL-2.0 | Yes | Yes (file-level) |
| LGPL-3.0 | Yes | Yes (library) |
| AGPL-3.0 | Yes | Yes (network) |
| Unlicense | Yes | No |
| ISC | Yes | No |

```typescript
import { checkLicense } from "@/lib/security";

const license = checkLicense("MIT");
console.log(license.permissions); // ["Commercial use", "Modification", ...]
```

### 6. Scoring System

**Source**: `lib/security/index.ts` — `getSecurityScore()`

Computes a normalized 0-100 security score based on finding severity:

- **Critical**: 40 points each
- **High**: 20 points each
- **Medium**: 10 points each
- **Low**: 3 points each
- **None**: 0 points

```
Score = 100 - (weightedSum / maxPossible) * 100

Levels:
  80-100: good
  60-79:  fair
  40-59:  poor
   0-39:  critical
```

```typescript
import { getSecurityScore } from "@/lib/security";

const score = getSecurityScore(findings);
console.log(`Score: ${score.score} (${score.level})`);
console.log(score.breakdown);  // { critical: 2, high: 5, medium: 3, ... }
```

## Security Scan Integration in Analysis Pipeline

During the `lib/analysis/index.ts` pipeline (stage 3, ~78% progress):

```
clone → walk files → detect → AST parse → graph → AI analysis → SECURITY SCAN → diagrams → docs
                                                                    │
                                                                    ▼
                                                         ┌─────────────────┐
                                                         │ scanForSecrets  │
                                                         │ on each file     │
                                                         └────────┬────────┘
                                                                  │
                                                                  ▼
                                                         ┌─────────────────┐
                                                         │ Persist to      │
                                                         │ SecurityFinding │
                                                         │ table (Prisma)  │
                                                         └─────────────────┘
```

## Dashboard Pages

Security scans and results are displayed under `app/dashboard/security/` with:
- Summary dashboard showing score, severity breakdown, trend
- Dependency vulnerabilities table with fix suggestions
- Secret findings list with file paths and snippets
- Container vulnerability reports per image
- OWASP recommendation cards
- License overview with compatibility warnings
