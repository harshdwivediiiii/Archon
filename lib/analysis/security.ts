export interface SecurityFindingResult {
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  category: "HARDCODED_SECRET" | "API_KEY" | "TOKEN" | "PASSWORD" | "PRIVATE_KEY" | "CONNECTION_STRING" | "EXPOSED_CREDENTIAL" | "UNSAFE_CONFIG" | "PUBLIC_RESOURCE" | "PRIVILEGE_ESCALATION";
  title: string;
  description?: string;
  filePath: string;
  lineNumber?: number;
  codeSnippet?: string;
  risk?: string;
  recommendation?: string;
}

const SECRET_PATTERNS: { regex: RegExp; severity: SecurityFindingResult["severity"]; category: SecurityFindingResult["category"]; title: string; risk: string; recommendation: string }[] = [
  {
    regex: /(?:password|passwd|pwd)\s*[=:]\s*["'][^"'\s]{4,}["']/i,
    severity: "CRITICAL",
    category: "PASSWORD",
    title: "Hardcoded Password",
    risk: "Direct credential exposure allows unauthorized access to systems",
    recommendation: "Move to environment variable or secret manager",
  },
  {
    regex: /(?:api[_-]?key|apikey|api_key)\s*[=:]\s*["'][^"'\s]{8,}["']/i,
    severity: "CRITICAL",
    category: "API_KEY",
    title: "Hardcoded API Key",
    risk: "API keys can be used to impersonate your service or access paid APIs",
    recommendation: "Store in environment variables or a secrets manager like AWS Secrets Manager",
  },
  {
    regex: /(?:secret|secret_key|secretkey)\s*[=:]\s*["'][^"'\s]{8,}["']/i,
    severity: "HIGH",
    category: "HARDCODED_SECRET",
    title: "Hardcoded Secret",
    risk: "Secrets in code can be extracted from version history",
    recommendation: "Use environment variables or a vault service",
  },
  {
    regex: /(?:token|auth_token|access_token|refresh_token)\s*[=:]\s*["'][^"'\s]{8,}["']/i,
    severity: "HIGH",
    category: "TOKEN",
    title: "Hardcoded Authentication Token",
    risk: "Tokens grant access to systems and APIs",
    recommendation: "Rotate immediately and use short-lived tokens from a secure store",
  },
  {
    regex: /(?:private_key|privatekey|ssh_key|ssh-private)\s*[=:]\s*["']/i,
    severity: "CRITICAL",
    category: "PRIVATE_KEY",
    title: "Hardcoded Private Key",
    risk: "Private keys compromise SSH, SSL/TLS, and code signing",
    recommendation: "Use SSH agent, hardware security module, or secrets manager",
  },
  {
    regex: /(?:mongodb|postgresql|mysql|redis):\/\/[^@]+@/i,
    severity: "HIGH",
    category: "CONNECTION_STRING",
    title: "Database Connection String with Credentials",
    risk: "Embedded credentials in connection strings expose databases",
    recommendation: "Use environment variables and connection string builders",
  },
  {
    regex: /(?:jwt_secret|jwtsecret|jwt-secret)\s*[=:]\s*["'][^"'\s]{4,}["']/i,
    severity: "CRITICAL",
    category: "HARDCODED_SECRET",
    title: "Hardcoded JWT Secret",
    risk: "JWT secrets allow forging authentication tokens",
    recommendation: "Generate a strong random secret and store in environment variables",
  },
  {
    regex: /(?:AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY)\s*[=:]\s*["'][^"'\s]+["']/i,
    severity: "CRITICAL",
    category: "API_KEY",
    title: "Hardcoded AWS Credential",
    risk: "AWS credentials can lead to cloud account compromise",
    recommendation: "Use IAM roles, instance profiles, or AWS Secrets Manager",
  },
  {
    regex: /(?:session_secret|cookie_secret|encryption_key)\s*[=:]\s*["'][^"'\s]{4,}["']/i,
    severity: "HIGH",
    category: "HARDCODED_SECRET",
    title: "Hardcoded Session or Encryption Secret",
    risk: "Compromised session secrets allow session hijacking",
    recommendation: "Generate unique secrets per environment",
  },
  {
    regex: /(?:slack_token|discord_token|telegram_token|bot_token)\s*[=:]\s*["'][^"'\s]+["']/i,
    severity: "HIGH",
    category: "TOKEN",
    title: "Hardcoded Chat Bot Token",
    risk: "Bot tokens can be used to send messages as your application",
    recommendation: "Store in environment variables and restrict bot permissions",
  },
  {
    regex: /(?:stripe|sk_live|pk_live|sk_test|pk_test)_[A-Za-z0-9]+/i,
    severity: "CRITICAL",
    category: "API_KEY",
    title: "Hardcoded Stripe API Key",
    risk: "Stripe keys allow payment operations on your behalf",
    recommendation: "Use Stripe's secret management or environment variables",
  },
  {
    regex: /(?:ghp_|gho_|ghu_|ghs_|ghr_)[A-Za-z0-9]{36}/,
    severity: "CRITICAL",
    category: "TOKEN",
    title: "Hardcoded GitHub Token",
    risk: "GitHub tokens can access repositories and trigger actions",
    recommendation: "Use GitHub Apps or OAuth with limited scopes",
  },
  {
    regex: /(?:OPENAI_API_KEY|sk-[A-Za-z0-9]{20,})/,
    severity: "HIGH",
    category: "API_KEY",
    title: "Hardcoded OpenAI API Key",
    risk: "OpenAI keys can be used to make API calls on your account",
    recommendation: "Store in environment variables and monitor usage",
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

export function scanForSecrets(
  filePath: string,
  content: string
): SecurityFindingResult[] {
  for (const ignored of IGNORED_PATHS) {
    if (filePath.includes(ignored)) return [];
  }

  const findings: SecurityFindingResult[] = [];
  const lines = content.split("\n");

  for (const pattern of SECRET_PATTERNS) {
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(pattern.regex);
      if (match) {
        const isEnvFile = filePath.endsWith(".env") || filePath.endsWith(".env.example");
        if (isEnvFile) continue;

        findings.push({
          severity: pattern.severity,
          category: pattern.category,
          title: pattern.title,
          description: `Found ${pattern.category.toLowerCase().replace(/_/g, " ")} in ${filePath}:${i + 1}`,
          filePath,
          lineNumber: i + 1,
          codeSnippet: lines[i].substring(0, 120).replace(match[0], match[0].substring(0, 8) + "***REDACTED***"),
          risk: pattern.risk,
          recommendation: pattern.recommendation,
        });
      }
    }
  }

  return findings;
}

export function classifyEnvironmentVariables(envVars: string[]): { name: string; category: string; risk: "low" | "medium" | "high" }[] {
  const classifications: { name: string; category: string; risk: "low" | "medium" | "high" }[] = [];
  for (const env of envVars) {
    const upper = env.toUpperCase();
    if (upper.includes("SECRET") || upper.includes("KEY") || upper.includes("TOKEN") || upper.includes("PASSWORD")) {
      classifications.push({ name: env, category: "credential", risk: "high" });
    } else if (upper.includes("URL") || upper.includes("HOST") || upper.includes("PORT") || upper.includes("DATABASE")) {
      classifications.push({ name: env, category: "connection", risk: "medium" });
    } else if (upper.includes("DEBUG") || upper.includes("LOG") || upper.includes("LEVEL") || upper.includes("NODE_ENV")) {
      classifications.push({ name: env, category: "config", risk: "low" });
    } else {
      classifications.push({ name: env, category: "other", risk: "low" });
    }
  }
  return classifications;
}

export function scanForEnvVarUsage(content: string): string[] {
  const envVars: string[] = [];
  const patterns = [
    /process\.env\.(\w+)/g,
    /process\.env\[['"](\w+)['"]\]/g,
    /env\(['"](\w+)['"]\)/g,
    /getenv\(['"](\w+)['"]\)/g,
    /environ\[['"](\w+)['"]\]/g,
  ];
  for (const pattern of patterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) envVars.push(match[1]);
    }
  }
  return [...new Set(envVars)];
}
