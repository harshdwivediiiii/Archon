const required = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "OPENAI_API_KEY",
];

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error("FATAL: Missing required environment variables:");
  missing.forEach((key) => console.error(`  - ${key}`));
  console.error("");
  console.error("The application cannot start without these variables.");
  console.error("Ensure the archon-secrets Kubernetes Secret is properly configured.");
  process.exit(1);
}

console.log("[startup] All required environment variables are set.");
console.log("[startup] Starting Next.js server...");
