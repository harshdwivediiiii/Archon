import { DetectedInfrastructure } from "../types";

const INFRA_FILES: Record<string, string> = {
  "Dockerfile": "docker",
  "docker-compose.yml": "docker",
  "docker-compose.yaml": "docker",
  "Dockerfile.dev": "docker",
  "Dockerfile.prod": "docker",
};

const K8S_PATTERNS = [
  /apiVersion:\s*v1/,
  /kind:\s*(Deployment|Service|Pod|ConfigMap|Secret|Ingress)/,
  /spec:\s*\n.*containers:/,
];

const TERRAFORM_PATTERNS = [
  /resource\s+"/,
  /data\s+"/,
  /provider\s+"/,
  /terraform\s*{/,
  /\.tf\s*$/,
];

const CI_CD_PATTERNS: Record<string, RegExp[]> = {
  "GitHub Actions": [
    /on:\s*(push|pull_request|workflow_dispatch)/,
    /uses:\s+/,
    /steps:/,
    /.github\/workflows/,
  ],
  "GitLab CI": [
    /stages:/,
    /gitlab-ci\.yml/,
    /script:/,
  ],
  "Jenkins": [
    /Jenkinsfile/,
    /pipeline\s*{/,
    /node\s*{/,
  ],
};

void CI_CD_PATTERNS;

const CLOUD_PATTERNS: Record<string, RegExp[]> = {
  "AWS": [
    /aws_/,
    /provider\s+"aws"/,
    /from\s+'@aws-sdk/,
    /boto3/,
    /AWS_ACCESS_KEY/,
    /AWS_SECRET/,
  ],
  "Azure": [
    /azurerm_/,
    /provider\s+"azurerm"/,
    /azure/,
    /AZURE_/,
  ],
  "GCP": [
    /google_/,
    /provider\s+"google"/,
    /@google-cloud/,
    /gcloud/,
    /GOOGLE_/,
  ],
};

export function detectInfrastructure(
  filePath: string,
  content: string
): DetectedInfrastructure[] {
  const detected: DetectedInfrastructure[] = [];
  const fileName = filePath.split("/").pop() || "";

  if (INFRA_FILES[fileName]) {
    detected.push({
      type: INFRA_FILES[fileName] as DetectedInfrastructure["type"],
      name: fileName,
      sourceFile: filePath,
      content: content.substring(0, 2000),
    });
  }

  const isK8sFile = fileName.endsWith(".yaml") || fileName.endsWith(".yml");
  if (isK8sFile) {
    for (const pattern of K8S_PATTERNS) {
      if (pattern.test(content)) {
        const kindMatch = content.match(/kind:\s*(\w+)/);
        const name = kindMatch ? `${kindMatch[1]}` : fileName;
        if (!detected.find((d) => d.name === name)) {
          detected.push({
            type: "kubernetes",
            name,
            sourceFile: filePath,
            content: content.substring(0, 2000),
          });
        }
        break;
      }
    }
  }

  if (fileName.endsWith(".tf")) {
    for (const pattern of TERRAFORM_PATTERNS) {
      if (pattern.test(content)) {
        const resourceMatch = content.match(/resource\s+"(\w+)"\s+"(\w+)"/);
        const name = resourceMatch
          ? `${resourceMatch[1]}.${resourceMatch[2]}`
          : fileName;
        if (!detected.find((d) => d.name === name)) {
          detected.push({
            type: "terraform",
            name,
            sourceFile: filePath,
            content: content.substring(0, 2000),
          });
        }
        break;
      }
    }
  }

  if (filePath.includes(".github/workflows") || fileName === ".github/workflows") {
    const eventMatch = content.match(/on:\s*\[?(push|pull_request|workflow_dispatch)/);
    const nameMatch = content.match(/name:\s*(.+)/);
    detected.push({
      type: "ci-cd",
      name: nameMatch?.[1] || `GitHub Action: ${eventMatch?.[1] || "workflow"}`,
      sourceFile: filePath,
      content: content.substring(0, 2000),
    });
  }

  for (const [cloud, patterns] of Object.entries(CLOUD_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(content)) {
        if (!detected.find((d) => d.name === cloud)) {
          detected.push({
            type: "cloud",
            name: cloud,
            sourceFile: filePath,
            content: cloud,
          });
        }
        break;
      }
    }
  }

  return detected;
}
