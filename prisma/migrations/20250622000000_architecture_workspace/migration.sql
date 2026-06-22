-- CreateEnum
CREATE TYPE "SecuritySeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO');

-- CreateEnum
CREATE TYPE "SecurityCategory" AS ENUM ('HARDCODED_SECRET', 'API_KEY', 'TOKEN', 'PASSWORD', 'PRIVATE_KEY', 'CONNECTION_STRING', 'EXPOSED_CREDENTIAL', 'UNSAFE_CONFIG', 'PUBLIC_RESOURCE', 'PRIVILEGE_ESCALATION');

-- CreateTable
CREATE TABLE "architecture_snapshots" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'system',
    "nodes" JSONB NOT NULL,
    "edges" JSONB NOT NULL,
    "metadata" JSONB,
    "commitSha" TEXT,
    "branch" TEXT,
    "tag" TEXT,
    "analysisRun" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "repositoryId" TEXT NOT NULL,

    CONSTRAINT "architecture_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_findings" (
    "id" TEXT NOT NULL,
    "severity" "SecuritySeverity" NOT NULL DEFAULT 'MEDIUM',
    "category" "SecurityCategory" NOT NULL DEFAULT 'HARDCODED_SECRET',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "filePath" TEXT NOT NULL,
    "lineNumber" INTEGER,
    "codeSnippet" TEXT,
    "risk" TEXT,
    "recommendation" TEXT,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "repositoryId" TEXT NOT NULL,
    "analysisId" TEXT,

    CONSTRAINT "security_findings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "architecture_snapshots_repositoryId_createdAt_key" ON "architecture_snapshots"("repositoryId", "createdAt");

-- AddForeignKey
ALTER TABLE "architecture_snapshots" ADD CONSTRAINT "architecture_snapshots_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_findings" ADD CONSTRAINT "security_findings_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_findings" ADD CONSTRAINT "security_findings_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "analyses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
