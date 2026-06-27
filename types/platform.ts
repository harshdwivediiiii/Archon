// ---------------------------------------------------------------------------
// Kubernetes Types
// ---------------------------------------------------------------------------

/** Kubernetes resource metadata. */
export interface K8sResourceMeta {
  name: string;
  namespace: string;
  uid: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  resourceVersion: string;
  creationTimestamp: string;
}

/** Kubernetes Namespace. */
export interface Namespace {
  meta: K8sResourceMeta;
  status: "Active" | "Terminating";
}

/** Container port mapping. */
export interface ContainerPort {
  name?: string;
  containerPort: number;
  protocol: "TCP" | "UDP" | "SCTP";
}

/** Resource requests and limits for a container. */
export interface ResourceRequirements {
  requests: Partial<Record<"cpu" | "memory" | "ephemeral-storage", string>>;
  limits: Partial<Record<"cpu" | "memory" | "ephemeral-storage", string>>;
}

/** Kubernetes Container. */
export interface Container {
  name: string;
  image: string;
  command?: string[];
  args?: string[];
  ports: ContainerPort[];
  env: EnvironmentVariable[];
  resources: ResourceRequirements;
  volumeMounts: VolumeMount[];
  livenessProbe?: Probe;
  readinessProbe?: Probe;
  imagePullPolicy: "Always" | "Never" | "IfNotPresent";
}

/** Kubernetes Probe (liveness / readiness / startup). */
export interface Probe {
  httpGet?: { path: string; port: number; httpHeaders?: { name: string; value: string }[] };
  exec?: { command: string[] };
  tcpSocket?: { port: number };
  initialDelaySeconds: number;
  timeoutSeconds: number;
  periodSeconds: number;
  successThreshold: number;
  failureThreshold: number;
}

/** Volume mount inside a container. */
export interface VolumeMount {
  name: string;
  mountPath: string;
  readOnly: boolean;
  subPath?: string;
}

/** Container status as reported by the kubelet. */
export interface ContainerStatus {
  name: string;
  containerID: string;
  image: string;
  imageID: string;
  ready: boolean;
  restartCount: number;
  state: "Running" | "Waiting" | "Terminated";
  startedAt?: string;
  reason?: string;
  message?: string;
}

/** Kubernetes Pod. */
export interface Pod {
  meta: K8sResourceMeta;
  spec: {
    containers: Container[];
    initContainers?: Container[];
    nodeName: string;
    restartPolicy: "Always" | "OnFailure" | "Never";
    serviceAccountName?: string;
    volumes?: Volume[];
  };
  status: {
    phase: "Pending" | "Running" | "Succeeded" | "Failed" | "Unknown";
    hostIP?: string;
    podIP?: string;
    conditions: PodCondition[];
    containerStatuses: ContainerStatus[];
    startTime?: string;
    qosClass?: "Guaranteed" | "Burstable" | "BestEffort";
  };
}

/** Pod condition. */
export interface PodCondition {
  type: "PodScheduled" | "Initialized" | "ContainersReady" | "Ready";
  status: "True" | "False" | "Unknown";
  lastTransitionTime?: string;
  reason?: string;
  message?: string;
}

/** Abstract volume definition. */
export interface Volume {
  name: string;
  hostPath?: { path: string; type?: string };
  emptyDir?: { medium?: string; sizeLimit?: string };
  persistentVolumeClaim?: { claimName: string; readOnly: boolean };
  configMap?: { name: string; items?: { key: string; path: string }[] };
  secret?: { secretName: string; items?: { key: string; path: string }[] };
  nfs?: { server: string; path: string; readOnly: boolean };
}

/** Selector for deployments / services. */
export interface LabelSelector {
  matchLabels: Record<string, string>;
  matchExpressions?: { key: string; operator: "In" | "NotIn" | "Exists" | "DoesNotExist"; values: string[] }[];
}

/** Kubernetes Deployment strategy. */
export interface K8sDeploymentStrategy {
  type: "Recreate" | "RollingUpdate";
  rollingUpdate?: {
    maxUnavailable?: number | string;
    maxSurge?: number | string;
  };
}

/** Kubernetes Deployment. */
export interface K8sDeployment {
  meta: K8sResourceMeta;
  spec: {
    replicas: number;
    selector: LabelSelector;
    template: PodTemplateSpec;
    strategy: K8sDeploymentStrategy;
    revisionHistoryLimit?: number;
    paused: boolean;
    minReadySeconds: number;
  };
  status: {
    replicas: number;
    readyReplicas: number;
    availableReplicas: number;
    unavailableReplicas: number;
    updatedReplicas: number;
    conditions: K8sDeploymentCondition[];
  };
}

/** Kubernetes Deployment condition. */
export interface K8sDeploymentCondition {
  type: "Available" | "Progressing" | "ReplicaFailure";
  status: "True" | "False" | "Unknown";
  reason?: string;
  message?: string;
  lastUpdateTime?: string;
  lastTransitionTime?: string;
}

/** Pod template embedded in higher-level resources. */
export interface PodTemplateSpec {
  meta?: Partial<K8sResourceMeta>;
  spec: Pod["spec"];
}

/** Kubernetes ReplicaSet. */
export interface ReplicaSet {
  meta: K8sResourceMeta;
  spec: {
    replicas: number;
    selector: LabelSelector;
    template: PodTemplateSpec;
    minReadySeconds: number;
  };
  status: {
    replicas: number;
    readyReplicas: number;
    availableReplicas: number;
    fullyLabeledReplicas?: number;
    conditions?: ReplicaSetCondition[];
  };
}

export interface ReplicaSetCondition {
  type: "ReplicaFailure";
  status: "True" | "False" | "Unknown";
  reason?: string;
  message?: string;
  lastTransitionTime?: string;
}

/** Kubernetes StatefulSet. */
export interface StatefulSet {
  meta: K8sResourceMeta;
  spec: {
    replicas: number;
    selector: LabelSelector;
    template: PodTemplateSpec;
    serviceName: string;
    podManagementPolicy: "OrderedReady" | "Parallel";
    updateStrategy: { type: "RollingUpdate" | "OnDelete"; rollingUpdate?: { partition?: number } };
    revisionHistoryLimit?: number;
    volumeClaimTemplates?: PersistentVolumeClaim[];
  };
  status: {
    replicas: number;
    readyReplicas: number;
    currentReplicas: number;
    updatedReplicas: number;
    currentRevision?: string;
    updateRevision?: string;
    conditions?: StatefulSetCondition[];
  };
}

export interface StatefulSetCondition {
  type: "ReplicaFailure";
  status: "True" | "False" | "Unknown";
  reason?: string;
  message?: string;
  lastTransitionTime?: string;
}

/** Kubernetes DaemonSet. */
export interface DaemonSet {
  meta: K8sResourceMeta;
  spec: {
    selector: LabelSelector;
    template: PodTemplateSpec;
    updateStrategy: { type: "RollingUpdate" | "OnDelete"; rollingUpdate?: { maxUnavailable?: number | string } };
    revisionHistoryLimit?: number;
    minReadySeconds: number;
  };
  status: {
    currentNumberScheduled: number;
    numberMisscheduled: number;
    desiredNumberScheduled: number;
    numberReady: number;
    updatedNumberScheduled: number;
    numberAvailable: number;
    numberUnavailable: number;
    conditions?: DaemonSetCondition[];
  };
}

export interface DaemonSetCondition {
  type: "Available" | "Progressing" | "ReplicaFailure";
  status: "True" | "False" | "Unknown";
  reason?: string;
  message?: string;
  lastTransitionTime?: string;
}

/** Service port specification. */
export interface ServicePort {
  name?: string;
  port: number;
  targetPort: number | string;
  nodePort?: number;
  protocol: "TCP" | "UDP" | "SCTP";
}

/** Kubernetes Service. */
export interface Service {
  meta: K8sResourceMeta;
  spec: {
    ports: ServicePort[];
    selector: Record<string, string>;
    type: "ClusterIP" | "NodePort" | "LoadBalancer" | "ExternalName";
    clusterIP?: string;
    loadBalancerIP?: string;
    externalTrafficPolicy?: "Local" | "Cluster";
    sessionAffinity: "None" | "ClientIP";
  };
  status: {
    loadBalancer?: { ingress: { hostname?: string; ip?: string }[] };
  };
}

/** Kubernetes Ingress. */
export interface IngressRule {
  host?: string;
  http: { paths: { path: string; pathType: "Exact" | "Prefix" | "ImplementationSpecific"; backend: IngressBackend }[] };
}

export interface IngressBackend {
  service?: { name: string; port: { number: number } };
  resource?: { apiGroup: string; kind: string; name: string };
}

export interface IngressTLS {
  hosts: string[];
  secretName: string;
}

/** Kubernetes Ingress. */
export interface Ingress {
  meta: K8sResourceMeta;
  spec: {
    ingressClassName?: string;
    rules: IngressRule[];
    tls?: IngressTLS[];
    defaultBackend?: IngressBackend;
  };
  status: { loadBalancer?: { ingress: { hostname?: string; ip?: string }[] } };
}

/** Kubernetes Secret. */
export interface Secret {
  meta: K8sResourceMeta;
  type: "Opaque" | "kubernetes.io/service-account-token" | "kubernetes.io/dockercfg" | "kubernetes.io/dockerconfigjson" | "kubernetes.io/basic-auth" | "kubernetes.io/ssh-auth" | "kubernetes.io/tls" | "bootstrap.kubernetes.io/token";
  data: Record<string, string>;
  stringData?: Record<string, string>;
}

/** Kubernetes ConfigMap. */
export interface ConfigMap {
  meta: K8sResourceMeta;
  data: Record<string, string>;
  binaryData?: Record<string, string>;
  immutable?: boolean;
}

/** Kubernetes PersistentVolume. */
export interface PersistentVolume {
  meta: K8sResourceMeta;
  spec: {
    capacity: Record<string, string>;
    accessModes: ("ReadWriteOnce" | "ReadOnlyMany" | "ReadWriteMany")[];
    persistentVolumeReclaimPolicy: "Retain" | "Recycle" | "Delete";
    storageClassName: string;
    mountOptions?: string[];
    claimRef?: { apiVersion: string; kind: string; name: string; namespace: string; uid: string };
    nodeAffinity?: { required: { nodeSelectorTerms: { matchExpressions: { key: string; operator: string; values: string[] }[] }[] } };
    hostPath?: { path: string; type?: string };
    nfs?: { server: string; path: string; readOnly: boolean };
  };
  status: {
    phase: "Available" | "Bound" | "Released" | "Failed";
    message?: string;
    reason?: string;
  };
}

/** Kubernetes PersistentVolumeClaim. */
export interface PersistentVolumeClaim {
  meta: K8sResourceMeta;
  spec: {
    accessModes: ("ReadWriteOnce" | "ReadOnlyMany" | "ReadWriteMany")[];
    resources: { requests: Partial<Record<"storage", string>> };
    storageClassName?: string;
    selector?: LabelSelector;
    volumeName?: string;
  };
  status: {
    phase: "Pending" | "Bound" | "Lost";
    accessModes?: ("ReadWriteOnce" | "ReadOnlyMany" | "ReadWriteMany")[];
    capacity?: Record<string, string>;
    conditions?: { type: string; status: string; lastProbeTime?: string; lastTransitionTime?: string; reason?: string; message?: string }[];
  };
}

/** Kubernetes Node. */
export interface Node {
  meta: K8sResourceMeta;
  spec: {
    podCIDR?: string;
    podCIDRs?: string[];
    taints: { key: string; value?: string; effect: "NoSchedule" | "PreferNoSchedule" | "NoExecute" }[];
    unschedulable?: boolean;
  };
  status: {
    capacity: Record<string, string>;
    allocatable: Record<string, string>;
    conditions: NodeCondition[];
    addresses: { type: "Hostname" | "InternalIP" | "ExternalIP"; address: string }[];
    nodeInfo: { machineID: string; systemUUID: string; bootID: string; kernelVersion: string; osImage: string; containerRuntimeVersion: string; kubeletVersion: string; kubeProxyVersion: string; architecture: string; operatingSystem: string };
    images: { names: string[]; sizeBytes: number }[];
  };
}

export interface NodeCondition {
  type: "Ready" | "MemoryPressure" | "DiskPressure" | "PIDPressure" | "NetworkUnavailable";
  status: "True" | "False" | "Unknown";
  reason?: string;
  message?: string;
  lastHeartbeatTime?: string;
  lastTransitionTime?: string;
}

/** Resource usage metrics for a pod or container. */
export interface ResourceMetrics {
  podName?: string;
  containerName?: string;
  namespace: string;
  cpu: {
    usage: string;
    usageNanoCores: number;
    request?: string;
    limit?: string;
  };
  memory: {
    usage: string;
    usageBytes: number;
    workingSetBytes: number;
    request?: string;
    limit?: string;
    pageFaults?: number;
    majorPageFaults?: number;
  };
  network?: {
    rxBytes: number;
    txBytes: number;
    rxErrors: number;
    txErrors: number;
  };
  timestamp: string;
  window: string;
}

/** Pod log entry. */
export interface PodLogs {
  podName: string;
  containerName?: string;
  namespace: string;
  logs: { timestamp: string; line: string }[];
  previous: boolean;
  tailLines?: number;
}

/** Pod event from `kubectl describe`. */
export interface PodEvent {
  type: "Normal" | "Warning";
  reason: string;
  message: string;
  source: { component: string; host?: string };
  firstTimestamp: string;
  lastTimestamp: string;
  count: number;
  involvedObject: { kind: string; name: string; namespace: string; uid?: string };
}

/** Options for rolling back a deployment. */
export interface DeploymentRollback {
  name: string;
  namespace: string;
  revision: number;
  dryRun: boolean;
  updatedAnnotations?: Record<string, string>;
}

/** Options for scaling a workload. */
export interface ScalingOptions {
  kind: "Deployment" | "StatefulSet" | "ReplicaSet" | "DaemonSet";
  name: string;
  namespace: string;
  replicas: number;
  currentReplicas?: number;
  resourceVersion?: string;
}


// ---------------------------------------------------------------------------
// Docker Types
// ---------------------------------------------------------------------------

/** Docker image reference. */
export interface DockerImage {
  id: string;
  repoDigest: string;
  repoTags: string[];
  parentId?: string;
  created: string;
  size: number;
  virtualSize: number;
  sharedSize?: number;
  architecture: string;
  os: string;
  osVersion?: string;
  author?: string;
  config?: {
    entrypoint?: string[];
    cmd?: string[];
    env?: string[];
    exposedPorts?: Record<string, Record<string, never>>;
    labels?: Record<string, string>;
    user?: string;
    workingDir?: string;
    volumes?: Record<string, Record<string, never>>;
  };
  layers?: ImageLayer[];
}

/** Individual image layer. */
export interface ImageLayer {
  id: string;
  createdBy: string;
  created: string;
  size: number;
  comment?: string;
}

/** Docker container. */
export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  imageID: string;
  created: string;
  state: "created" | "running" | "paused" | "restarting" | "removing" | "exited" | "dead";
  status: string;
  ports: { privatePort: number; publicPort?: number; type: "tcp" | "udp"; ip?: string }[];
  mounts: { source: string; destination: string; mode: string; rw: boolean; propagation: string }[];
  networkSettings: {
    networks: Record<string, { ipAddress: string; gateway: string; macAddress: string; networkID: string }>;
    ipAddress?: string;
    gateway?: string;
  };
  command: string;
  environment: string[];
  labels: Record<string, string>;
  restartPolicy: { name: string; maximumRetryCount?: number };
  hostConfig: {
    networkMode: string;
    privileged: boolean;
    publishAllPorts: boolean;
    readonlyRootfs: boolean;
    restartPolicy: { name: string; maximumRetryCount?: number };
  };
}

/** Docker volume. */
export interface DockerVolume {
  name: string;
  driver: string;
  mountpoint: string;
  created: string;
  scope: "local" | "global";
  status?: Record<string, unknown>;
  labels: Record<string, string>;
  options: Record<string, string>;
  usageData?: { size: number; refCount: number };
}

/** Docker network. */
export interface DockerNetwork {
  id: string;
  name: string;
  driver: string;
  scope: "local" | "global" | "swarm";
  attachable: boolean;
  ingress: boolean;
  internal: boolean;
  ipam: {
    driver: string;
    options: Record<string, string>;
    config: { subnet?: string; gateway?: string; ipRange?: string; auxAddress?: Record<string, string> }[];
  };
  containers?: Record<string, { name: string; endpointID: string; macAddress: string; ipv4Address: string; ipv6Address: string }>;
  options: Record<string, string>;
  labels: Record<string, string>;
}

/** Real-time container resource usage. */
export interface ContainerStats {
  containerId: string;
  name: string;
  cpu: { usagePercent: number; systemUsage: number; userUsage: number };
  memory: { usageBytes: number; limitBytes: number; usagePercent: number; rssBytes?: number; cacheBytes?: number };
  network: { rxBytes: number; txBytes: number; rxDropped: number; txDropped: number; rxErrors: number; txErrors: number };
  blockIO: { readBytes: number; writeBytes: number; readOps: number; writeOps: number };
  pids: number;
  read: string;
  preread: string;
}

/** Docker Compose service definition. */
export interface DockerComposeService {
  image?: string;
  build?: { context: string; dockerfile?: string; args?: Record<string, string>; target?: string };
  ports: string[];
  environment: Record<string, string>;
  volumes: string[];
  networks: string[];
  depends_on: string[];
  restart: string;
  command?: string;
  entrypoint?: string;
  healthcheck?: {
    test: string | string[];
    interval?: string;
    timeout?: string;
    retries?: number;
    start_period?: string;
  };
  labels: Record<string, string>;
  deploy?: {
    replicas?: number;
    resources?: {
      limits?: { cpus?: string; memory?: string };
      reservations?: { cpus?: string; memory?: string };
    };
    restart_policy?: { condition: "none" | "on-failure" | "any" };
  };
}

/** Docker Compose file (v3). */
export interface DockerCompose {
  version: string;
  services: Record<string, DockerComposeService>;
  networks?: Record<string, { driver?: string; driver_opts?: Record<string, string>; external?: boolean; name?: string }>;
  volumes?: Record<string, { driver?: string; driver_opts?: Record<string, string>; external?: boolean; name?: string }>;
  secrets?: Record<string, { file?: string; external?: boolean; name?: string }>;
  configs?: Record<string, { file?: string; external?: boolean; name?: string }>;
}

/** Single layer in a docker image build output. */
export interface DockerLayer {
  id: string;
  command: string;
  created: string;
  size: number;
}


// ---------------------------------------------------------------------------
// DevOps Types
// ---------------------------------------------------------------------------

/** CI/CD pipeline status. */
export type PipelineStatus = "pending" | "running" | "succeeded" | "failed" | "canceled" | "skipped" | "timed_out";

/** CI/CD pipeline definition. */
export interface CICDPipeline {
  id: string;
  name: string;
  provider: "github_actions" | "gitlab_ci" | "jenkins" | "circleci" | "travis_ci" | "azure_pipelines" | "buildkite" | "drone";
  status: PipelineStatus;
  stages: PipelineStage[];
  trigger: "push" | "pull_request" | "tag" | "schedule" | "manual" | "webhook";
  branch: string;
  commitSha: string;
  runNumber: number;
  runId: string;
  startedAt: string;
  finishedAt?: string;
  duration?: number;
  url: string;
  artifacts?: BuildArtifact[];
  logs?: string;
}

/** A single stage within a CI/CD pipeline. */
export interface PipelineStage {
  name: string;
  status: PipelineStatus;
  startedAt?: string;
  finishedAt?: string;
  duration?: number;
  jobs: { name: string; status: PipelineStatus; startedAt?: string; finishedAt?: string; duration?: number; logs?: string }[];
}

/** Build artifact produced by a CI/CD pipeline. */
export interface BuildArtifact {
  name: string;
  path: string;
  size: number;
  type: string;
  digest?: string;
  expiresAt?: string;
  downloadUrl?: string;
}

/** Environment variable key-value pair. */
export interface EnvironmentVariable {
  name: string;
  value: string;
  secret: boolean;
}

/** Deployment target environments. */
export type DeploymentEnvironment = "development" | "staging" | "production" | "canary" | "preview";

/** Deployment record. */
export interface Deployment {
  id: string;
  projectId?: string;
  environment: DeploymentEnvironment;
  version: string;
  status: "pending" | "running" | "succeeded" | "failed" | "rolled_back" | "cancelled";
  strategy: "rolling" | "blue_green" | "canary" | "recreate" | "revision";
  commitSha?: string;
  branch?: string;
  imageTag?: string;
  replicas: number;
  startedAt: string;
  finishedAt?: string;
  duration?: number;
  deployedBy: string;
  rollbackRef?: string;
  metadata: Record<string, string>;
}

/** Renamed from `Secret_` to avoid collision with the Kubernetes `Secret`. */
export interface SecretEntry {
  name: string;
  key: string;
  value: string;
  masked: boolean;
  source: "manual" | "vault" | "aws_secrets_manager" | "gcp_secret_manager" | "azure_key_vault" | "env_file";
  rotateAt?: string;
  version?: number;
}

/** Health check summary for a deployment. */
export interface DeploymentHealth {
  deploymentId: string;
  status: "healthy" | "degraded" | "unhealthy" | "unknown";
  podStatus: { total: number; ready: number; failed: number; pending: number };
  resourceUsage: { cpuPercent: number; memoryPercent: number; diskPercent?: number };
  responseTime: number;
  errorRate: number;
  uptimePercent: number;
  checksPassed: number;
  checksFailed: number;
  lastChecked: string;
}

/** Request to rollback a deployment. */
export interface RollbackRequest {
  deploymentId: string;
  targetVersion: string;
  reason: string;
  requestedBy: string;
  force: boolean;
}


// ---------------------------------------------------------------------------
// Security Types
// ---------------------------------------------------------------------------

/** Security severity levels (matches Prisma `SecuritySeverity`). */
export type SecuritySeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";

/** Security category (matches Prisma `SecurityCategory`). */
export type SecurityCategory =
  | "HARDCODED_SECRET"
  | "API_KEY"
  | "TOKEN"
  | "PASSWORD"
  | "PRIVATE_KEY"
  | "CONNECTION_STRING"
  | "EXPOSED_CREDENTIAL"
  | "UNSAFE_CONFIG"
  | "PUBLIC_RESOURCE"
  | "PRIVILEGE_ESCALATION"
  | "MALWARE"
  | "SQL_INJECTION"
  | "XSS"
  | "CSRF"
  | "INSECURE_DEPENDENCY"
  | "MISCONFIGURATION";

/** Generic vulnerability. */
export interface Vulnerability {
  id: string;
  source: "snyk" | "dependabot" | "trivy" | "grype" | "sonarqube" | "semgrep" | "custom";
  title: string;
  description: string;
  severity: SecuritySeverity;
  cvssScore?: number;
  cvssVector?: string;
  cveId?: string;
  cweId?: string;
  packageName?: string;
  packageVersion?: string;
  fixVersion?: string;
  filePath?: string;
  lineNumber?: number;
  publishedAt: string;
  detectedAt: string;
  remediatedAt?: string;
  status: "open" | "fixed" | "accepted_risk" | "false_positive";
}

/** Dependency vulnerability (OSV / GHSA format). */
export interface DependencyVulnerability {
  id: string;
  ecosystem: "npm" | "pypi" | "maven" | "rubygems" | "go" | "cargo" | "nuget" | "docker" | "linux";
  packageName: string;
  installedVersion: string;
  fixedVersion?: string;
  affectedVersions: string[];
  title: string;
  description: string;
  severity: SecuritySeverity;
  cvssScore?: number;
  cve: string[];
  ghsa?: string[];
  references: string[];
  exploitExists: boolean;
  publishedAt: string;
  detectedAt: string;
  status: "open" | "fixed" | "ignored";
}

/** Secret finding in source code. */
export interface SecretFinding {
  id: string;
  type: string;
  description: string;
  severity: SecuritySeverity;
  filePath: string;
  lineNumber: number;
  columnNumber?: number;
  codeSnippet: string;
  commitSha?: string;
  author?: string;
  detectedAt: string;
  isValidated: boolean;
}

/** Container / image vulnerability. */
export interface ContainerVulnerability {
  image: string;
  imageDigest: string;
  os: { family: string; version: string };
  vulnerabilities: Vulnerability[];
  score: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  criticalCount: number;
  scannedAt: string;
}

/** OWASP Top-10 recommendation. */
export interface OWASPRecommendation {
  category: string;
  risk: string;
  recommendation: string;
  references: string[];
  severity: SecuritySeverity;
}

/** Software license information. */
export interface LicenseInfo {
  name: string;
  spdxId: string;
  osiApproved: boolean;
  url?: string;
  permissions: string[];
  conditions: string[];
  limitations: string[];
}

/** Aggregated security score for a project. */
export interface SecurityScore {
  overall: number;
  dependencyScore: number;
  codeScore: number;
  containerScore: number;
  secretsScore: number;
  complianceScore: number;
  totalVulnerabilities: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  scannedFiles: number;
  lastScan: string;
  trend: "improving" | "declining" | "stable";
}

/** Comprehensive security report. */
export interface SecurityReport {
  projectId: string;
  score: SecurityScore;
  vulnerabilities: Vulnerability[];
  dependencyVulnerabilities: DependencyVulnerability[];
  secretFindings: SecretFinding[];
  containerVulnerabilities: ContainerVulnerability[];
  owasp: OWASPRecommendation[];
  licenses: LicenseInfo[];
  generatedAt: string;
  summary: string;
}


// ---------------------------------------------------------------------------
// Code Review Types
// ---------------------------------------------------------------------------

/** Severity of a code review finding. */
export type ReviewSeverity = "critical" | "major" | "minor" | "info" | "nitpick";

/** Category of a code review finding. */
export type ReviewCategory =
  | "bug"
  | "security"
  | "performance"
  | "style"
  | "best_practice"
  | "testing"
  | "documentation"
  | "duplication"
  | "complexity"
  | "design"
  | "maintainability"
  | "accessibility"
  | "error_handling"
  | "type_safety";

/** Request to review a set of code changes. */
export interface ReviewRequest {
  id: string;
  repositoryId: string;
  pullRequestId?: number;
  commitSha: string;
  baseSha?: string;
  files: { path: string; status: "added" | "modified" | "removed" | "renamed"; additions: number; deletions: number; patch?: string }[];
  title: string;
  description?: string;
  author?: string;
  createdAt: string;
}

/** Single finding from a code review. */
export interface ReviewFinding {
  id: string;
  path: string;
  lineStart: number;
  lineEnd: number;
  columnStart?: number;
  columnEnd?: number;
  severity: ReviewSeverity;
  category: ReviewCategory;
  message: string;
  description?: string;
  suggestion?: string;
  code?: string;
  ruleId?: string;
  contextBefore?: string[];
  contextAfter?: string[];
}

/** Inline comment on a specific line of a diff. */
export interface InlineComment {
  id: string;
  path: string;
  line: number;
  side: "left" | "right";
  body: string;
  author: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  replyTo?: string;
}

/** Result of a completed code review. */
export interface ReviewResult {
  requestId: string;
  findings: ReviewFinding[];
  summary: string;
  score: number;
  passed: boolean;
  totalIssues: number;
  criticalCount: number;
  majorCount: number;
  minorCount: number;
  infoCount: number;
  suggestions: string[];
  reviewedAt: string;
  reviewer: string;
}


// ---------------------------------------------------------------------------
// Dashboard Types
// ---------------------------------------------------------------------------

/** Aggregate statistics for the dashboard home page. */
export interface DashboardStats {
  totalProjects: number;
  totalRepositories: number;
  totalDeployments: number;
  totalUsers: number;
  activeDeployments: number;
  failedDeployments: number;
  pendingReviews: number;
  unresolvedVulnerabilities: number;
  todayDeployments: number;
  averageResponseTime: number;
  uptimePercent: number;
  lastUpdated: string;
}

/** Overall health of a project (colored tile on dashboard). */
export interface ProjectHealth {
  projectId: string;
  projectName: string;
  status: "healthy" | "warning" | "critical" | "unknown";
  deploymentHealth?: DeploymentHealth;
  securityScore?: number;
  lastDeployment?: Deployment;
  pendingChanges: number;
  openIssues: number;
}

/** Normalized health score (0-100). */
export interface HealthScore {
  overall: number;
  availability: number;
  latency: number;
  errors: number;
  security: number;
  dependencies: number;
  coverage: number;
  freshness: number;
}

/** Single data point for chart rendering. */
export interface ChartDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  timestamp?: string;
  category?: string;
  metadata?: Record<string, unknown>;
}

/** Activity event for the activity feed. */
export interface ActivityEvent {
  id: string;
  type: "deployment" | "pipeline" | "review" | "security" | "scaling" | "config_change" | "rollback" | "user_action";
  title: string;
  description: string;
  severity: "info" | "warning" | "error" | "success";
  actor?: string;
  resourceType?: string;
  resourceId?: string;
  metadata: Record<string, unknown>;
  timestamp: string;
}

/** Notification item for the notification drawer. */
export type NotificationType = "deployment" | "pipeline" | "review" | "security" | "system" | "alert" | "mention";

/** Notification priority levels. */
export type NotificationPriority = "low" | "normal" | "high" | "critical";

/** Notification item. */
export interface NotificationItem {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  read: boolean;
  actionable: boolean;
  actionUrl?: string;
  source?: string;
  expiresAt?: string;
  createdAt: string;
}


// ---------------------------------------------------------------------------
// Analytics Types
// ---------------------------------------------------------------------------

/** Language distribution in a repository. */
export interface LanguageDistribution {
  language: string;
  files: number;
  lines: number;
  blanks: number;
  comments: number;
  code: number;
  percentage: number;
}

/** Contributor activity summary. */
export interface ContributorActivity {
  name: string;
  email: string;
  username?: string;
  avatarUrl?: string;
  commits: number;
  additions: number;
  deletions: number;
  pullRequests: number;
  reviews: number;
  firstCommit: string;
  lastCommit: string;
  daysActive: number;
  isActive: boolean;
}

/** Commit frequency over a time window. */
export interface CommitFrequency {
  date: string;
  commits: number;
  authors: string[];
  additions: number;
  deletions: number;
}

/** Code ownership mapping (directory → primary maintainers). */
export interface CodeOwnership {
  path: string;
  owner: string;
  ownerEmail?: string;
  files: number;
  lastModified: string;
  coverage?: number;
  changeFrequency: number;
}

/** Technical debt estimation. */
export interface TechnicalDebt {
  totalIssues: number;
  estimatedHours: number;
  estimatedCost: number;
  categories: {
    complexity: number;
    duplication: number;
    codeSmells: number;
    styleViolations: number;
    securityIssues: number;
    testCoverage: number;
  };
  ratio: number;
  remediationEffort: "low" | "medium" | "high" | "critical";
}

/** Freshness of project dependencies. */
export interface DependencyFreshness {
  total: number;
  upToDate: number;
  outdated: number;
  deprecated: number;
  vulnerable: number;
  majorBehind: number;
  minorBehind: number;
  patchBehind: number;
  staleDependencies: string[];
}

/** Comprehensive repository analytics. */
export interface RepoAnalytics {
  repositoryId: string;
  languages: LanguageDistribution[];
  contributors: ContributorActivity[];
  commitFrequency: CommitFrequency[];
  ownership: CodeOwnership[];
  debt: TechnicalDebt;
  dependencyFreshness: DependencyFreshness;
  totalCommits: number;
  totalBranches: number;
  totalTags: number;
  totalReleases: number;
  openIssues: number;
  openPullRequests: number;
  stars: number;
  forks: number;
  avgTimeToMerge: number;
  avgTimeToCloseIssue: number;
  busFactor: number;
  analyzedAt: string;
}


// ---------------------------------------------------------------------------
// Documentation Types
// ---------------------------------------------------------------------------

/** Supported documentation output types. */
export type DocType = "markdown" | "html" | "pdf" | "openapi" | "swagger" | "typedoc" | "jsdoc" | "asciidoc" | "notion" | "confluence";

/** Request to generate documentation from source code or architecture. */
export interface DocGenerationRequest {
  id: string;
  repositoryId: string;
  docType: DocType;
  title: string;
  description?: string;
  scope: "full" | "api" | "architecture" | "database" | "deployment" | "readme" | "contributing" | "security" | "custom";
  includeSections: string[];
  excludePatterns?: string[];
  aiEnhance: boolean;
  templateName?: string;
  customPrompt?: string;
}

/** A single section of a generated document. */
export interface DocSection {
  id: string;
  title: string;
  content: string;
  level: number;
  order: number;
  parentId?: string;
  children?: DocSection[];
  metadata: Record<string, unknown>;
}

/** Fully generated documentation. */
export interface GeneratedDoc {
  id: string;
  requestId: string;
  title: string;
  docType: DocType;
  sections: DocSection[];
  content: string;
  wordCount: number;
  generatedAt: string;
  tokensUsed?: number;
  model?: string;
  metadata: Record<string, unknown>;
}


// ---------------------------------------------------------------------------
// Database Types (Prisma / Postgres)
// ---------------------------------------------------------------------------

/** Information about a database table. */
export interface TableInfo {
  schema: string;
  name: string;
  type: "table" | "view" | "materialized_view" | "foreign_table";
  owner: string;
  columns: ColumnInfo[];
  indexes: { name: string; columns: string[]; unique: boolean; method: "btree" | "hash" | "gist" | "gin" | "brin" }[];
  rowCount: number;
  sizeBytes: number;
  totalSizeBytes: number;
  description?: string;
  estimatedRows?: number;
  relations: RelationshipInfo[];
}

/** Information about a single column. */
export interface ColumnInfo {
  name: string;
  ordinal: number;
  type: string;
  udtName: string;
  nullable: boolean;
  defaultValue?: string;
  isPrimaryKey: boolean;
  isUnique: boolean;
  isForeignKey: boolean;
  isIndexed: boolean;
  isGenerated: boolean;
  comment?: string;
  references?: { table: string; column: string };
}

/** Table relationship (foreign key). */
export interface RelationshipInfo {
  constraintName: string;
  sourceSchema: string;
  sourceTable: string;
  sourceColumn: string;
  targetSchema: string;
  targetTable: string;
  targetColumn: string;
  updateRule: "NO ACTION" | "RESTRICT" | "CASCADE" | "SET NULL" | "SET DEFAULT";
  deleteRule: "NO ACTION" | "RESTRICT" | "CASCADE" | "SET NULL" | "SET DEFAULT";
}

/** Database migration record. */
export interface MigrationRecord {
  id: string;
  name: string;
  appliedAt: string;
  duration: number;
  status: "applied" | "pending" | "rolled_back" | "failed";
  checksum: string;
  sql: string;
  rollbackSql?: string;
  author: string;
}

/** Result of an arbitrary SQL query. */
export interface QueryResult {
  command: string;
  rowCount: number;
  rows: Record<string, unknown>[];
  fields: { name: string; dataTypeID: number; dataType: string }[];
  duration: number;
  error?: string;
}

/** Health of a database connection and server. */
export interface DatabaseHealth {
  status: "connected" | "disconnected" | "degraded" | "error";
  serverVersion: string;
  activeConnections: number;
  maxConnections: number;
  uptime: number;
  databaseSizeBytes: number;
  replicationLag?: number;
  cacheHitRatio: number;
  transactionRate: number;
  avgQueryTime: number;
  slowQueries: number;
  deadlocks: number;
  lastChecked: string;
}


// ---------------------------------------------------------------------------
// Developer Tool Types
// ---------------------------------------------------------------------------

/** Supported developer tools. */
export type ToolType =
  | "regex_tester"
  | "json_formatter"
  | "jwt_decoder"
  | "base64_codec"
  | "hash_generator"
  | "uuid_generator"
  | "color_converter"
  | "html_preview"
  | "markdown_preview"
  | "diff_viewer"
  | "sql_formatter"
  | "yaml_converter"
  | "certificate_decoder"
  | "cron_parser"
  | "ip_calculator"
  | "string_escape"
  | "url_codec";

/** Result from a developer tool execution. */
export interface ToolResult {
  tool: ToolType;
  input: string;
  output: string;
  success: boolean;
  duration: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

/** Request to test a regex pattern. */
export interface RegexRequest {
  pattern: string;
  flags: string;
  testStrings: string[];
  replacement?: string;
}

/** Request to format / lint a code snippet. */
export interface FormatterRequest {
  language: string;
  code: string;
  options: Record<string, unknown>;
}

/** Result from decoding a JWT token. */
export interface JWTDecodeResult {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  valid: boolean;
  expired: boolean;
  expiresAt?: string;
  issuedAt?: string;
  issuer?: string;
  subject?: string;
  audience?: string | string[];
}


// ---------------------------------------------------------------------------
// Chat Types
// ---------------------------------------------------------------------------

/** Role of a chat message participant. */
export type MessageRole = "user" | "assistant" | "system" | "tool";

/** A single chat message. */
export interface ChatMessage {
  id: string;
  chatId: string;
  role: MessageRole;
  content: string;
  metadata?: Record<string, unknown>;
  sources?: RAGContext[];
  tokensUsed?: number;
  model?: string;
  latency?: number;
  createdAt: string;
}

/** A chat session. */
export interface ChatSession {
  id: string;
  title: string;
  workspaceId?: string;
  repositoryId?: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

/** Context retrieved by RAG to ground an answer. */
export interface RAGContext {
  id: string;
  source: "codebase" | "documentation" | "architecture" | "analysis" | "security" | "custom";
  title: string;
  content: string;
  path?: string;
  score: number;
  chunkIndex: number;
  totalChunks: number;
  startLine?: number;
  endLine?: number;
  metadata?: Record<string, unknown>;
}

/** Request payload for sending a chat message. */
export interface ChatRequest {
  sessionId?: string;
  message: string;
  repositoryId?: string;
  workspaceId?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  stream: boolean;
}

/** Response from a chat model invocation. */
export interface ChatResponse {
  sessionId: string;
  message: ChatMessage;
  contexts: RAGContext[];
  suggestions: string[];
  tokensUsed: number;
  model: string;
  latency: number;
  finishReason: "stop" | "length" | "tool_calls" | "content_filter" | "error";
}

/** Result from a semantic code search. */
export interface SemanticSearchResult {
  query: string;
  results: CodeChunk[];
  totalResults: number;
  duration: number;
}

/** A code chunk returned by semantic search or indexing. */
export interface CodeChunk {
  id: string;
  path: string;
  language: string;
  content: string;
  startLine: number;
  endLine: number;
  score: number;
  symbolName?: string;
  symbolKind?: "function" | "class" | "method" | "variable" | "module" | "interface" | "type";
  repositoryId?: string;
  commitSha?: string;
}


// ---------------------------------------------------------------------------
// Observability Types
// ---------------------------------------------------------------------------

/** A single span in a distributed trace. */
export interface Span {
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  name: string;
  kind: "internal" | "server" | "client" | "producer" | "consumer";
  status: { code: "OK" | "ERROR"; message?: string };
  startTime: string;
  endTime: string;
  duration: number;
  serviceName: string;
  resource: Record<string, string>;
  attributes: Record<string, unknown>;
  events: { name: string; timestamp: string; attributes: Record<string, unknown> }[];
  links: { traceId: string; spanId: string; attributes: Record<string, unknown> }[];
}

/** A distributed trace composed of spans. */
export interface Trace {
  traceId: string;
  rootSpanId: string;
  spans: Span[];
  duration: number;
  startTime: string;
  endTime: string;
  serviceCount: number;
  rootServiceName: string;
  rootOperationName: string;
  status: "OK" | "ERROR";
  tags: Record<string, string>;
}

/** A metric data point. */
export interface Metric {
  name: string;
  description?: string;
  unit: string;
  type: "counter" | "gauge" | "histogram" | "summary";
  value: number;
  labels: Record<string, string>;
  timestamp: string;
  histogram?: { buckets: { le: number; count: number }[]; sum: number; count: number };
  summary?: { quantiles: { quantile: number; value: number }[]; sum: number; count: number };
}

/** A single log entry. */
export interface LogEntry {
  timestamp: string;
  level: "trace" | "debug" | "info" | "warn" | "error" | "fatal";
  message: string;
  logger: string;
  serviceName: string;
  traceId?: string;
  spanId?: string;
  resource: Record<string, string>;
  attributes: Record<string, unknown>;
  error?: { type: string; message: string; stackTrace?: string };
}

/** Overall health status of a component. */
export type HealthStatus = "healthy" | "degraded" | "unhealthy" | "unknown";

/** Result of a single health check. */
export interface HealthCheck {
  name: string;
  status: HealthStatus;
  duration: number;
  message?: string;
  error?: string;
  lastChecked: string;
  observedValue?: number;
  observedUnit?: string;
  threshold?: number;
  tags: string[];
}

/** Service health status including all checks. */
export interface ServiceStatus {
  serviceName: string;
  version: string;
  status: HealthStatus;
  checks: HealthCheck[];
  uptime: number;
  startTime: string;
  memoryUsageBytes: number;
  cpuUsagePercent: number;
  requestRate: number;
  errorRate: number;
  avgLatency: number;
  dependencies: { name: string; status: HealthStatus; latency: number }[];
  metadata: Record<string, string>;
  lastUpdated: string;
}
