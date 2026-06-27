import { execSync, spawn, type SpawnOptionsWithoutStdio } from "child_process";

export class KubectlError extends Error {
  readonly command: string;
  readonly stderr: string;
  readonly exitCode: number | null;

  constructor(command: string, stderr: string, exitCode: number | null) {
    super(`kubectl command failed: ${command}\n${stderr}`);
    this.name = "KubectlError";
    this.command = command;
    this.stderr = stderr;
    this.exitCode = exitCode;
  }
}

export class KubectlNotFoundError extends Error {
  constructor() {
    super("kubectl not found in PATH");
    this.name = "KubectlNotFoundError";
  }
}

export class ResourceNotFoundError extends KubectlError {
  readonly resourceType: string;
  readonly resourceName: string;
  readonly namespace?: string;

  constructor(
    command: string,
    stderr: string,
    exitCode: number | null,
    resourceType: string,
    resourceName: string,
    namespace?: string,
  ) {
    super(command, stderr, exitCode);
    this.name = "ResourceNotFoundError";
    this.resourceType = resourceType;
    this.resourceName = resourceName;
    this.namespace = namespace;
  }
}

export interface ResourceReference {
  apiVersion?: string;
  kind: string;
  name: string;
  namespace?: string;
}

export interface KubeObjectMeta {
  name: string;
  namespace?: string;
  uid?: string;
  resourceVersion?: string;
  generation?: number;
  creationTimestamp?: string;
  deletionTimestamp?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  ownerReferences?: KubeOwnerReference[];
  finalizers?: string[];
}

export interface KubeOwnerReference {
  apiVersion: string;
  kind: string;
  name: string;
  uid: string;
  controller?: boolean;
  blockOwnerDeletion?: boolean;
}

export interface KubeNamespace {
  apiVersion: "v1";
  kind: "Namespace";
  metadata: KubeObjectMeta;
  status?: {
    phase: "Active" | "Terminating";
    conditions?: KubeNamespaceCondition[];
  };
}

export interface KubeNamespaceCondition {
  type: string;
  status: "True" | "False" | "Unknown";
  lastTransitionTime: string;
  message?: string;
  reason?: string;
}

export interface KubeContainer {
  name: string;
  image: string;
  imagePullPolicy?: string;
  ports?: { containerPort: number; protocol: string; name?: string }[];
  env?: { name: string; value?: string; valueFrom?: unknown }[];
  resources?: {
    limits?: { cpu?: string; memory?: string; [key: string]: string | undefined };
    requests?: { cpu?: string; memory?: string; [key: string]: string | undefined };
  };
  volumeMounts?: { name: string; mountPath: string; readOnly?: boolean; subPath?: string }[];
  livenessProbe?: unknown;
  readinessProbe?: unknown;
  startupProbe?: unknown;
  securityContext?: unknown;
  command?: string[];
  args?: string[];
  workingDir?: string;
  envFrom?: { prefix?: string; configMapRef?: { name: string }; secretRef?: { name: string } }[];
  terminationMessagePath?: string;
  terminationMessagePolicy?: string;
  stdin?: boolean;
  tty?: boolean;
}

export interface KubeContainerStatus {
  name: string;
  state: {
    running?: { startedAt: string };
    waiting?: { reason: string; message?: string };
    terminated?: { exitCode: number; reason?: string; message?: string; startedAt?: string; finishedAt?: string };
  };
  lastState?: {
    running?: { startedAt: string };
    waiting?: { reason: string; message?: string };
    terminated?: { exitCode: number; reason?: string; message?: string; startedAt?: string; finishedAt?: string };
  };
  ready: boolean;
  restartCount: number;
  image: string;
  imageID: string;
  containerID?: string;
  started?: boolean;
}

export interface KubePod {
  apiVersion: "v1";
  kind: "Pod";
  metadata: KubeObjectMeta;
  spec: {
    nodeName?: string;
    serviceAccountName?: string;
    containers: KubeContainer[];
    initContainers?: KubeContainer[];
    volumes?: { name: string; [key: string]: unknown }[];
    restartPolicy?: string;
    terminationGracePeriodSeconds?: number;
    dnsPolicy?: string;
    securityContext?: unknown;
    schedulerName?: string;
    priority?: number;
    priorityClassName?: string;
    tolerations?: unknown[];
    affinity?: unknown;
    topologySpreadConstraints?: unknown[];
    hostNetwork?: boolean;
    dnsConfig?: unknown;
    enableServiceLinks?: boolean;
    preemptionPolicy?: string;
  };
  status?: {
    phase: string;
    conditions?: KubePodCondition[];
    hostIP?: string;
    podIP?: string;
    podIPs?: { ip: string }[];
    startTime?: string;
    containerStatuses?: KubeContainerStatus[];
    initContainerStatuses?: KubeContainerStatus[];
    qosClass?: string;
    nominatedNodeName?: string;
    reason?: string;
    message?: string;
  };
}

export interface KubePodCondition {
  type: string;
  status: "True" | "False" | "Unknown";
  lastProbeTime?: string;
  lastTransitionTime?: string;
  reason?: string;
  message?: string;
}

export interface KubeDeploymentSpec {
  replicas?: number;
  selector: { matchLabels: Record<string, string>; matchExpressions?: unknown[] };
  template: {
    metadata: KubeObjectMeta;
    spec: {
      containers: KubeContainer[];
      initContainers?: KubeContainer[];
      volumes?: { name: string; [key: string]: unknown }[];
      serviceAccountName?: string;
      securityContext?: unknown;
      restartPolicy?: string;
      terminationGracePeriodSeconds?: number;
      dnsPolicy?: string;
      schedulerName?: string;
      affinity?: unknown;
      tolerations?: unknown[];
      topologySpreadConstraints?: unknown[];
      hostNetwork?: boolean;
      dnsConfig?: unknown;
      enableServiceLinks?: boolean;
    };
  };
  strategy?: {
    type: "Recreate" | "RollingUpdate";
    rollingUpdate?: { maxUnavailable?: string; maxSurge?: string };
  };
  minReadySeconds?: number;
  revisionHistoryLimit?: number;
  paused?: boolean;
  progressDeadlineSeconds?: number;
}

export interface KubeDeploymentStatus {
  observedGeneration?: number;
  replicas: number;
  updatedReplicas?: number;
  readyReplicas?: number;
  availableReplicas?: number;
  unavailableReplicas?: number;
  conditions?: KubeDeploymentCondition[];
  collisionCount?: number;
}

export interface KubeDeploymentCondition {
  type: string;
  status: "True" | "False" | "Unknown";
  lastUpdateTime?: string;
  lastTransitionTime?: string;
  reason?: string;
  message?: string;
}

export interface KubeDeployment {
  apiVersion: "apps/v1";
  kind: "Deployment";
  metadata: KubeObjectMeta;
  spec: KubeDeploymentSpec;
  status: KubeDeploymentStatus;
}

export interface KubeReplicaSet {
  apiVersion: "apps/v1";
  kind: "ReplicaSet";
  metadata: KubeObjectMeta;
  spec: {
    replicas?: number;
    selector: { matchLabels: Record<string, string>; matchExpressions?: unknown[] };
    template?: { metadata: KubeObjectMeta; spec: { containers: KubeContainer[] } };
    minReadySeconds?: number;
  };
  status: {
    replicas: number;
    fullyLabeledReplicas?: number;
    readyReplicas?: number;
    availableReplicas?: number;
    observedGeneration?: number;
    conditions?: { type: string; status: string; lastTransitionTime: string; reason?: string; message?: string }[];
  };
}

export interface KubeStatefulSet {
  apiVersion: "apps/v1";
  kind: "StatefulSet";
  metadata: KubeObjectMeta;
  spec: {
    replicas?: number;
    selector: { matchLabels: Record<string, string> };
    serviceName: string;
    template: { metadata: KubeObjectMeta; spec: { containers: KubeContainer[] } };
    volumeClaimTemplates?: { metadata: KubeObjectMeta; spec: unknown }[];
    podManagementPolicy?: string;
    updateStrategy?: { type: string; rollingUpdate?: { partition?: number } };
    revisionHistoryLimit?: number;
    minReadySeconds?: number;
    persistentVolumeClaimRetentionPolicy?: { whenDeleted?: string; whenScaled?: string };
    ordinality?: string;
  };
  status: {
    replicas: number;
    readyReplicas?: number;
    currentReplicas?: number;
    updatedReplicas?: number;
    currentRevision?: string;
    updateRevision?: string;
    collisionCount?: number;
    observedGeneration?: number;
    availableReplicas?: number;
    conditions?: { type: string; status: string; lastTransitionTime: string; reason?: string; message?: string }[];
  };
}

export interface KubeDaemonSet {
  apiVersion: "apps/v1";
  kind: "DaemonSet";
  metadata: KubeObjectMeta;
  spec: {
    selector: { matchLabels: Record<string, string>; matchExpressions?: unknown[] };
    template: { metadata: KubeObjectMeta; spec: { containers: KubeContainer[] } };
    updateStrategy?: { type: string; rollingUpdate?: { maxUnavailable?: string; maxSurge?: string } };
    minReadySeconds?: number;
    revisionHistoryLimit?: number;
  };
  status: {
    currentNumberScheduled: number;
    numberMisscheduled: number;
    desiredNumberScheduled: number;
    numberReady: number;
    observedGeneration?: number;
    updatedNumberScheduled?: number;
    numberAvailable?: number;
    numberUnavailable?: number;
    collisionCount?: number;
    conditions?: { type: string; status: string; lastTransitionTime: string; reason?: string; message?: string }[];
  };
}

export interface KubeServicePort {
  name?: string;
  protocol: string;
  port: number;
  targetPort?: number | string;
  nodePort?: number;
  appProtocol?: string;
}

export interface KubeService {
  apiVersion: "v1";
  kind: "Service";
  metadata: KubeObjectMeta;
  spec: {
    ports?: KubeServicePort[];
    selector?: Record<string, string>;
    clusterIP?: string;
    clusterIPs?: string[];
    type?: string;
    externalIPs?: string[];
    sessionAffinity?: string;
    loadBalancerIP?: string;
    loadBalancerClass?: string;
    externalName?: string;
    externalTrafficPolicy?: string;
    internalTrafficPolicy?: string;
    healthCheckNodePort?: number;
    publishNotReadyAddresses?: boolean;
    sessionAffinityConfig?: unknown;
    ipFamilies?: string[];
    ipFamilyPolicy?: string;
    allocateLoadBalancerNodePorts?: boolean;
    loadBalancerSourceRanges?: string[];
  };
  status?: {
    loadBalancer?: {
      ingress?: { hostname?: string; ip?: string; ports?: { port: number; protocol: string; error?: string }[] }[];
    };
    conditions?: { type: string; status: string; lastTransitionTime: string; reason?: string; message?: string }[];
  };
}

export interface KubeIngressTLS {
  hosts?: string[];
  secretName?: string;
}

export interface KubeIngressRule {
  host?: string;
  http?: {
    paths: {
      path: string;
      pathType: string;
      backend: {
        service?: { name: string; port: { number?: number; name?: string } };
        resource?: { apiGroup?: string; kind: string; name: string };
      };
    }[];
  };
}

export interface KubeIngress {
  apiVersion: "networking.k8s.io/v1";
  kind: "Ingress";
  metadata: KubeObjectMeta;
  spec: {
    ingressClassName?: string;
    defaultBackend?: unknown;
    tls?: KubeIngressTLS[];
    rules?: KubeIngressRule[];
  };
  status?: {
    loadBalancer?: {
      ingress?: { hostname?: string; ip?: string; ports?: { port: number; protocol: string; error?: string }[] }[];
    };
  };
}

export interface KubeSecret {
  apiVersion: "v1";
  kind: "Secret";
  metadata: KubeObjectMeta;
  type: string;
  data?: Record<string, string>;
  stringData?: Record<string, string>;
  immutable?: boolean;
}

export interface KubeConfigMap {
  apiVersion: "v1";
  kind: "ConfigMap";
  metadata: KubeObjectMeta;
  data?: Record<string, string>;
  binaryData?: Record<string, string>;
  immutable?: boolean;
}

export interface KubePersistentVolumeSpec {
  capacity: Record<string, string>;
  accessModes: string[];
  persistentVolumeReclaimPolicy: string;
  storageClassName?: string;
  mountOptions?: string[];
  volumeMode?: string;
  nodeAffinity?: unknown;
  claimRef?: { apiVersion?: string; kind?: string; name?: string; namespace?: string; uid?: string };
  [key: string]: unknown;
}

export interface KubePersistentVolume {
  apiVersion: "v1";
  kind: "PersistentVolume";
  metadata: KubeObjectMeta;
  spec: KubePersistentVolumeSpec;
  status?: {
    phase: string;
    message?: string;
    reason?: string;
    lastPhaseTransitionTime?: string;
  };
}

export interface KubePersistentVolumeClaimSpec {
  accessModes?: string[];
  selector?: unknown;
  resources?: {
    requests?: Record<string, string>;
    limits?: Record<string, string>;
  };
  volumeName?: string;
  storageClassName?: string;
  volumeMode?: string;
  dataSource?: { apiGroup?: string; kind: string; name: string };
  dataSourceRef?: { apiGroup?: string; kind: string; name: string; namespace?: string };
}

export interface KubePersistentVolumeClaim {
  apiVersion: "v1";
  kind: "PersistentVolumeClaim";
  metadata: KubeObjectMeta;
  spec: KubePersistentVolumeClaimSpec;
  status?: {
    phase: string;
    accessModes?: string[];
    capacity?: Record<string, string>;
    conditions?: { type: string; status: string; lastProbeTime?: string; lastTransitionTime?: string; reason?: string; message?: string }[];
    allocatedResources?: Record<string, string>;
    currentVolumeAttributesClassName?: string;
    modifyVolumeStatus?: { status: string; targetVolumeAttributesClassName?: string };
  };
}

export interface KubeNodeAddress {
  type: string;
  address: string;
}

export interface KubeNodeImage {
  names: string[];
  sizeBytes?: number;
}

export interface KubeNode {
  apiVersion: "v1";
  kind: "Node";
  metadata: KubeObjectMeta;
  spec: {
    podCIDR?: string;
    podCIDRs?: string[];
    providerID?: string;
    unschedulable?: boolean;
    taints?: { key: string; value?: string; effect: string }[];
    configSource?: unknown;
    doExternal?: boolean;
  };
  status?: {
    capacity: Record<string, string>;
    allocatable: Record<string, string>;
    phase?: string;
    conditions: KubeNodeCondition[];
    addresses: KubeNodeAddress[];
    daemonEndpoints?: unknown;
    nodeInfo?: {
      machineID: string;
      systemUUID: string;
      bootID: string;
      kernelVersion: string;
      osImage: string;
      containerRuntimeVersion: string;
      kubeletVersion: string;
      kubeProxyVersion: string;
      operatingSystem: string;
      architecture: string;
    };
    images?: KubeNodeImage[];
    volumesInUse?: string[];
    volumesAttached?: { name: string; devicePath: string }[];
    config?: unknown;
    runtimeHandlers?: { name: string }[];
    features?: unknown;
  };
}

export interface KubeNodeCondition {
  type: string;
  status: "True" | "False" | "Unknown";
  lastHeartbeatTime?: string;
  lastTransitionTime?: string;
  reason?: string;
  message?: string;
}

export interface KubeEvent {
  apiVersion: "v1";
  kind: "Event";
  metadata: KubeObjectMeta;
  involvedObject: {
    kind: string;
    namespace?: string;
    name?: string;
    uid?: string;
    apiVersion?: string;
    resourceVersion?: string;
    fieldPath?: string;
  };
  reason: string;
  message: string;
  source?: { component: string; host?: string };
  firstTimestamp?: string;
  lastTimestamp?: string;
  count?: number;
  type: string;
  eventTime?: string;
  series?: { count: number; lastObservedTime: string };
  action?: string;
  related?: { kind: string; namespace?: string; name?: string; uid?: string; apiVersion?: string; resourceVersion?: string };
  reportingComponent?: string;
  reportingInstance?: string;
}

export interface ResourceMetrics {
  name: string;
  namespace?: string;
  container?: string;
  cpu: string;
  memory: string;
  cpuValue: number;
  memoryValue: number;
  timestamp?: string;
  window?: string;
}

export interface PodLogsOptions {
  container?: string;
  tail?: number;
  follow?: boolean;
  timestamps?: boolean;
  previous?: boolean;
  sinceSeconds?: number;
  sinceTime?: string;
  prefix?: boolean;
}

export interface PodExecOptions {
  container?: string;
  stdin?: boolean;
  tty?: boolean;
  timeout?: number;
}

export interface PodExecResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

export interface PodTerminalOptions {
  container?: string;
  shell?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface KubectlListResponse<T> {
  apiVersion: string;
  kind: string;
  items: T[];
  metadata?: { resourceVersion?: string; continue?: string; remainingItemCount?: number };
}

function detectKubectl(): string {
  const paths = ["kubectl", "/usr/local/bin/kubectl", "/usr/bin/kubectl", "/snap/bin/kubectl"];
  for (const p of paths) {
    try {
      execSync(`${p} version --client -o json`, { stdio: "pipe" });
      return p;
    } catch {
      continue;
    }
  }
  throw new KubectlNotFoundError();
}

function parseCpu(value: string): number {
  if (value.endsWith("n")) return Math.round(parseFloat(value) / 1_000_000);
  if (value.endsWith("u")) return Math.round(parseFloat(value) / 1_000);
  if (value.endsWith("m")) return parseFloat(value);
  return parseFloat(value) * 1000;
}

function parseMemory(value: string): number {
  const num = parseFloat(value);
  if (value.endsWith("Ki")) return Math.round(num * 1024);
  if (value.endsWith("Mi")) return Math.round(num * 1024 * 1024);
  if (value.endsWith("Gi")) return Math.round(num * 1024 * 1024 * 1024);
  if (value.endsWith("Ti")) return Math.round(num * 1024 * 1024 * 1024 * 1024);
  if (value.endsWith("Pi")) return Math.round(num * 1024 * 1024 * 1024 * 1024 * 1024);
  if (value.endsWith("Ei")) return Math.round(num * 1024 * 1024 * 1024 * 1024 * 1024 * 1024);
  if (value.endsWith("k") || value.endsWith("K")) return Math.round(num * 1000);
  if (value.endsWith("M")) return Math.round(num * 1000 * 1000);
  if (value.endsWith("G")) return Math.round(num * 1000 * 1000 * 1000);
  if (value.endsWith("T")) return Math.round(num * 1000 * 1000 * 1000 * 1000);
  if (value.endsWith("P")) return Math.round(num * 1000 * 1000 * 1000 * 1000 * 1000);
  if (value.endsWith("E")) return Math.round(num * 1000 * 1000 * 1000 * 1000 * 1000 * 1000);
  return Math.round(num);
}

export class PodTerminal {
  private process: ReturnType<typeof spawn> | null = null;
  private readonly client: KubernetesClient;
  readonly podName: string;
  readonly namespace: string;
  readonly container: string;
  readonly shell: string;
  private dataCallbacks: Set<(data: string) => void> = new Set();
  private exitCallbacks: Set<(code: number | null) => void> = new Set();
  private errorCallbacks: Set<(error: Error) => void> = new Set();
  private _isConnected = false;
  private _exitCode: number | null = null;

  constructor(
    client: KubernetesClient,
    podName: string,
    namespace: string,
    options: PodTerminalOptions = {},
  ) {
    this.client = client;
    this.podName = podName;
    this.namespace = namespace;
    this.container = options.container ?? "";
    this.shell = options.shell ?? "/bin/sh";
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  get exitCode(): number | null {
    return this._exitCode;
  }

  connect(): void {
    if (this._isConnected) {
      return;
    }

    const args = ["exec", "-it"];

    if (this.container) {
      args.push("-c", this.container);
    }

    args.push("-n", this.namespace, this.podName, "--", this.shell);

    const kubectlPath = this.client["kubectlPath"];
    const kubeconfig = this.client["kubeconfig"];
    const context = this.client["context"];

    const finalArgs: string[] = [];
    if (kubeconfig) {
      finalArgs.push("--kubeconfig", kubeconfig);
    }
    if (context) {
      finalArgs.push("--context", context);
    }
    finalArgs.push(...args);

    const options: SpawnOptionsWithoutStdio = {
      stdio: ["pipe", "pipe", "pipe"],
    };

    try {
      this.process = spawn(kubectlPath, finalArgs, options);

      this.process.on("error", (err) => {
        this._isConnected = false;
        this.errorCallbacks.forEach((cb) => cb(err));
      });

      this.process.on("exit", (code) => {
        this._isConnected = false;
        this._exitCode = code;
        this.exitCallbacks.forEach((cb) => cb(code));
      });

      if (this.process.stdout) {
        this.process.stdout.on("data", (chunk: Buffer) => {
          const text = chunk.toString("utf-8");
          this.dataCallbacks.forEach((cb) => cb(text));
        });
      }

      if (this.process.stderr) {
        this.process.stderr.on("data", (chunk: Buffer) => {
          const text = chunk.toString("utf-8");
          this.dataCallbacks.forEach((cb) => cb(text));
        });
      }

      this._isConnected = true;
    } catch (error) {
      this._isConnected = false;
      this.errorCallbacks.forEach((cb) =>
        cb(error instanceof Error ? error : new Error(String(error))),
      );
    }
  }

  write(data: string): void {
    if (!this._isConnected || !this.process?.stdin) {
      throw new Error("Terminal is not connected");
    }
    this.process.stdin.write(data);
  }

  writeLine(data: string): void {
    this.write(`${data}\n`);
  }

  onData(callback: (data: string) => void): () => void {
    this.dataCallbacks.add(callback);
    return () => {
      this.dataCallbacks.delete(callback);
    };
  }

  onExit(callback: (code: number | null) => void): () => void {
    this.exitCallbacks.add(callback);
    return () => {
      this.exitCallbacks.delete(callback);
    };
  }

  onError(callback: (error: Error) => void): () => void {
    this.errorCallbacks.add(callback);
    return () => {
      this.errorCallbacks.delete(callback);
    };
  }

  close(): void {
    if (this.process) {
      if (this.process.stdin) {
        this.process.stdin.end();
      }
      this.process.kill("SIGTERM");
      this.process = null;
    }
    this._isConnected = false;
  }

  resize(cols: number, rows: number): void {
    if (this.process?.stdin && (this.process.stdin as { isTTY?: boolean }).isTTY) {
      (this.process.stdin as { columns?: number; rows?: number }).columns = cols;
      (this.process.stdin as { columns?: number; rows?: number }).rows = rows;
    }
  }
}

export class KubernetesClient {
  private kubectlPath: string;
  private kubeconfig: string | undefined;
  private context: string | undefined;
  private defaultNamespace: string;

  constructor(options: {
    kubeconfig?: string;
    context?: string;
    namespace?: string;
  } = {}) {
    this.kubectlPath = detectKubectl();
    this.kubeconfig = options.kubeconfig;
    this.context = options.context;
    this.defaultNamespace = options.namespace ?? "default";
  }

  private getBaseArgs(): string[] {
    const args: string[] = [];
    if (this.kubeconfig) {
      args.push("--kubeconfig", this.kubeconfig);
    }
    if (this.context) {
      args.push("--context", this.context);
    }
    return args;
  }

  private buildArgs(subcommand: string, resource: string, ...extra: string[]): string[] {
    return [...this.getBaseArgs(), subcommand, resource, ...extra];
  }

  private exec(...args: string[]): string {
    const fullCommand = `${this.kubectlPath} ${args.join(" ")}`;
    try {
      const result = execSync(`${this.kubectlPath} ${args.map(a => `'${a.replace(/'/g, "'\\''")}'`).join(" ")}`, {
        stdio: "pipe",
        encoding: "utf-8",
        maxBuffer: 50 * 1024 * 1024,
      });
      return result.trim();
    } catch (error: unknown) {
      if (error instanceof Error && "stderr" in error) {
        const stderr = (error as unknown as { stderr: Buffer | string }).stderr.toString();
        const status = (error as unknown as { status?: number | null }).status ?? null;
        throw new KubectlError(fullCommand, stderr, status);
      }
      throw error;
    }
  }

  private execJson<T>(...args: string[]): T {
    const out = this.exec(...args, "-o", "json");
    return JSON.parse(out) as T;
  }

  private execList<T>(...args: string[]): T[] {
    const out = this.execJson<KubectlListResponse<T>>(...args);
    return out.items;
  }

  private nsArgs(namespace?: string): string[] {
    const ns = namespace ?? this.defaultNamespace;
    return ["-n", ns];
  }

  // ---------------------------------------------------------------------------
  // Namespaces
  // ---------------------------------------------------------------------------

  listNamespaces(): KubeNamespace[] {
    return this.execList<KubeNamespace>("get", "namespaces");
  }

  getNamespace(name: string): KubeNamespace {
    return this.execJson<KubeNamespace>("get", "namespace", name);
  }

  describeNamespace(name: string): string {
    return this.exec("describe", "namespace", name);
  }

  // ---------------------------------------------------------------------------
  // Pods
  // ---------------------------------------------------------------------------

  listPods(namespace?: string): KubePod[] {
    return this.execList<KubePod>("get", "pods", ...this.nsArgs(namespace));
  }

  getPod(name: string, namespace?: string): KubePod {
    return this.execJson<KubePod>("get", "pod", name, ...this.nsArgs(namespace));
  }

  describePod(name: string, namespace?: string): string {
    return this.exec("describe", "pod", name, ...this.nsArgs(namespace));
  }

  getPodLogs(name: string, namespace?: string, options?: PodLogsOptions): string {
    const args: string[] = ["logs", name, ...this.nsArgs(namespace)];
    if (options?.container) args.push("-c", options.container);
    if (options?.tail !== undefined) args.push("--tail", String(options.tail));
    if (options?.follow) args.push("--follow");
    if (options?.timestamps) args.push("--timestamps");
    if (options?.previous) args.push("--previous");
    if (options?.sinceSeconds !== undefined) args.push("--since", String(options.sinceSeconds));
    if (options?.sinceTime) args.push("--since-time", options.sinceTime);
    if (options?.prefix) args.push("--prefix");
    return this.exec(...args);
  }

  execInPod(name: string, command: string[], namespace?: string, options?: PodExecOptions): PodExecResult {
    const args: string[] = ["exec", name, ...this.nsArgs(namespace)];
    if (options?.container) args.push("-c", options.container);
    if (options?.stdin) args.push("-i");
    if (options?.tty) args.push("-t");
    args.push("--", ...command);

    const fullCommand = `${this.kubectlPath} ${args.join(" ")}`;
    try {
      const out = execSync(`${this.kubectlPath} ${args.map(a => `'${a.replace(/'/g, "'\\''")}'`).join(" ")}`, {
        stdio: "pipe",
        encoding: "utf-8",
        maxBuffer: 50 * 1024 * 1024,
        timeout: options?.timeout,
      });
      return { stdout: out.trim(), stderr: "", exitCode: 0 };
    } catch (error: unknown) {
      if (error instanceof Error && "stderr" in error) {
        const execErr = error as unknown as { stderr: Buffer | string; stdout: Buffer | string; status?: number | null };
        return {
          stdout: execErr.stdout?.toString().trim() ?? "",
          stderr: execErr.stderr?.toString().trim() ?? error.message,
          exitCode: execErr.status ?? 1,
        };
      }
      return { stdout: "", stderr: String(error), exitCode: 1 };
    }
  }

  getPodTerminal(name: string, namespace?: string, options?: PodTerminalOptions): PodTerminal {
    return new PodTerminal(this, name, namespace ?? this.defaultNamespace, options);
  }

  // ---------------------------------------------------------------------------
  // Deployments
  // ---------------------------------------------------------------------------

  listDeployments(namespace?: string): KubeDeployment[] {
    return this.execList<KubeDeployment>("get", "deployments", ...this.nsArgs(namespace));
  }

  getDeployment(name: string, namespace?: string): KubeDeployment {
    return this.execJson<KubeDeployment>("get", "deployment", name, ...this.nsArgs(namespace));
  }

  describeDeployment(name: string, namespace?: string): string {
    return this.exec("describe", "deployment", name, ...this.nsArgs(namespace));
  }

  scaleDeployment(name: string, replicas: number, namespace?: string): void {
    this.exec("scale", "deployment", name, "--replicas", String(replicas), ...this.nsArgs(namespace));
  }

  restartDeployment(name: string, namespace?: string): void {
    this.exec("rollout", "restart", "deployment", name, ...this.nsArgs(namespace));
  }

  rolloutUndoDeployment(name: string, namespace?: string, revision?: number): void {
    const args: string[] = ["rollout", "undo", "deployment", name, ...this.nsArgs(namespace)];
    if (revision !== undefined) args.push("--to-revision", String(revision));
    this.exec(...args);
  }

  rolloutStatusDeployment(name: string, namespace?: string): string {
    return this.exec("rollout", "status", "deployment", name, ...this.nsArgs(namespace));
  }

  rolloutHistoryDeployment(name: string, namespace?: string, revision?: number): string {
    const args: string[] = ["rollout", "history", "deployment", name, ...this.nsArgs(namespace)];
    if (revision !== undefined) args.push("--revision", String(revision));
    return this.exec(...args);
  }

  // ---------------------------------------------------------------------------
  // ReplicaSets
  // ---------------------------------------------------------------------------

  listReplicaSets(namespace?: string): KubeReplicaSet[] {
    return this.execList<KubeReplicaSet>("get", "replicasets", ...this.nsArgs(namespace));
  }

  getReplicaSet(name: string, namespace?: string): KubeReplicaSet {
    return this.execJson<KubeReplicaSet>("get", "replicaset", name, ...this.nsArgs(namespace));
  }

  describeReplicaSet(name: string, namespace?: string): string {
    return this.exec("describe", "replicaset", name, ...this.nsArgs(namespace));
  }

  // ---------------------------------------------------------------------------
  // StatefulSets
  // ---------------------------------------------------------------------------

  listStatefulSets(namespace?: string): KubeStatefulSet[] {
    return this.execList<KubeStatefulSet>("get", "statefulsets", ...this.nsArgs(namespace));
  }

  getStatefulSet(name: string, namespace?: string): KubeStatefulSet {
    return this.execJson<KubeStatefulSet>("get", "statefulset", name, ...this.nsArgs(namespace));
  }

  describeStatefulSet(name: string, namespace?: string): string {
    return this.exec("describe", "statefulset", name, ...this.nsArgs(namespace));
  }

  scaleStatefulSet(name: string, replicas: number, namespace?: string): void {
    this.exec("scale", "statefulset", name, "--replicas", String(replicas), ...this.nsArgs(namespace));
  }

  restartStatefulSet(name: string, namespace?: string): void {
    this.exec("rollout", "restart", "statefulset", name, ...this.nsArgs(namespace));
  }

  rolloutUndoStatefulSet(name: string, namespace?: string, revision?: number): void {
    const args: string[] = ["rollout", "undo", "statefulset", name, ...this.nsArgs(namespace)];
    if (revision !== undefined) args.push("--to-revision", String(revision));
    this.exec(...args);
  }

  // ---------------------------------------------------------------------------
  // DaemonSets
  // ---------------------------------------------------------------------------

  listDaemonSets(namespace?: string): KubeDaemonSet[] {
    return this.execList<KubeDaemonSet>("get", "daemonsets", ...this.nsArgs(namespace));
  }

  getDaemonSet(name: string, namespace?: string): KubeDaemonSet {
    return this.execJson<KubeDaemonSet>("get", "daemonset", name, ...this.nsArgs(namespace));
  }

  describeDaemonSet(name: string, namespace?: string): string {
    return this.exec("describe", "daemonset", name, ...this.nsArgs(namespace));
  }

  restartDaemonSet(name: string, namespace?: string): void {
    this.exec("rollout", "restart", "daemonset", name, ...this.nsArgs(namespace));
  }

  // ---------------------------------------------------------------------------
  // Services
  // ---------------------------------------------------------------------------

  listServices(namespace?: string): KubeService[] {
    return this.execList<KubeService>("get", "services", ...this.nsArgs(namespace));
  }

  getService(name: string, namespace?: string): KubeService {
    return this.execJson<KubeService>("get", "service", name, ...this.nsArgs(namespace));
  }

  describeService(name: string, namespace?: string): string {
    return this.exec("describe", "service", name, ...this.nsArgs(namespace));
  }

  // ---------------------------------------------------------------------------
  // Ingress
  // ---------------------------------------------------------------------------

  listIngresses(namespace?: string): KubeIngress[] {
    return this.execList<KubeIngress>("get", "ingresses", ...this.nsArgs(namespace));
  }

  getIngress(name: string, namespace?: string): KubeIngress {
    return this.execJson<KubeIngress>("get", "ingress", name, ...this.nsArgs(namespace));
  }

  describeIngress(name: string, namespace?: string): string {
    return this.exec("describe", "ingress", name, ...this.nsArgs(namespace));
  }

  // ---------------------------------------------------------------------------
  // Secrets
  // ---------------------------------------------------------------------------

  listSecrets(namespace?: string): KubeSecret[] {
    return this.execList<KubeSecret>("get", "secrets", ...this.nsArgs(namespace));
  }

  getSecret(name: string, namespace?: string): KubeSecret {
    return this.execJson<KubeSecret>("get", "secret", name, ...this.nsArgs(namespace));
  }

  describeSecret(name: string, namespace?: string): string {
    return this.exec("describe", "secret", name, ...this.nsArgs(namespace));
  }

  // ---------------------------------------------------------------------------
  // ConfigMaps
  // ---------------------------------------------------------------------------

  listConfigMaps(namespace?: string): KubeConfigMap[] {
    return this.execList<KubeConfigMap>("get", "configmaps", ...this.nsArgs(namespace));
  }

  getConfigMap(name: string, namespace?: string): KubeConfigMap {
    return this.execJson<KubeConfigMap>("get", "configmap", name, ...this.nsArgs(namespace));
  }

  describeConfigMap(name: string, namespace?: string): string {
    return this.exec("describe", "configmap", name, ...this.nsArgs(namespace));
  }

  // ---------------------------------------------------------------------------
  // PersistentVolumes
  // ---------------------------------------------------------------------------

  listPersistentVolumes(): KubePersistentVolume[] {
    return this.execList<KubePersistentVolume>("get", "pv");
  }

  getPersistentVolume(name: string): KubePersistentVolume {
    return this.execJson<KubePersistentVolume>("get", "pv", name);
  }

  describePersistentVolume(name: string): string {
    return this.exec("describe", "pv", name);
  }

  // ---------------------------------------------------------------------------
  // PersistentVolumeClaims
  // ---------------------------------------------------------------------------

  listPersistentVolumeClaims(namespace?: string): KubePersistentVolumeClaim[] {
    return this.execList<KubePersistentVolumeClaim>("get", "pvc", ...this.nsArgs(namespace));
  }

  getPersistentVolumeClaim(name: string, namespace?: string): KubePersistentVolumeClaim {
    return this.execJson<KubePersistentVolumeClaim>("get", "pvc", name, ...this.nsArgs(namespace));
  }

  describePersistentVolumeClaim(name: string, namespace?: string): string {
    return this.exec("describe", "pvc", name, ...this.nsArgs(namespace));
  }

  // ---------------------------------------------------------------------------
  // Nodes
  // ---------------------------------------------------------------------------

  listNodes(): KubeNode[] {
    return this.execList<KubeNode>("get", "nodes");
  }

  getNode(name: string): KubeNode {
    return this.execJson<KubeNode>("get", "node", name);
  }

  describeNode(name: string): string {
    return this.exec("describe", "node", name);
  }

  // ---------------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------------

  listEvents(namespace?: string): KubeEvent[] {
    return this.execList<KubeEvent>("get", "events", ...this.nsArgs(namespace));
  }

  getEvent(name: string, namespace?: string): KubeEvent {
    return this.execJson<KubeEvent>("get", "event", name, ...this.nsArgs(namespace));
  }

  describeEvent(name: string, namespace?: string): string {
    return this.exec("describe", "event", name, ...this.nsArgs(namespace));
  }

  // ---------------------------------------------------------------------------
  // Metrics
  // ---------------------------------------------------------------------------

  topPods(namespace?: string): ResourceMetrics[] {
    const args = ["top", "pod", "--no-headers", ...this.nsArgs(namespace)];
    const out = this.exec(...args);
    return this.parseTopPodOutput(out, namespace);
  }

  topNodes(): ResourceMetrics[] {
    const out = this.exec("top", "node", "--no-headers");
    return this.parseTopNodeOutput(out);
  }

  private parseTopPodOutput(output: string, namespace?: string): ResourceMetrics[] {
    const lines = output.split("\n").filter((l) => l.trim().length > 0);
    return lines.map((line) => {
      const parts = line.trim().split(/\s+/);
      const cpu = parts[1] ?? "0";
      const memory = parts[2] ?? "0";
      return {
        name: parts[0],
        namespace: namespace ?? this.defaultNamespace,
        cpu,
        memory,
        cpuValue: parseCpu(cpu),
        memoryValue: parseMemory(memory),
      };
    });
  }

  private parseTopNodeOutput(output: string): ResourceMetrics[] {
    const lines = output.split("\n").filter((l) => l.trim().length > 0);
    return lines.map((line) => {
      const parts = line.trim().split(/\s+/);
      const cpu = parts[1] ?? "0";
      const memory = parts[3] ?? "0";
      return {
        name: parts[0],
        cpu,
        memory,
        cpuValue: parseCpu(cpu),
        memoryValue: parseMemory(memory),
      };
    });
  }

  // ---------------------------------------------------------------------------
  // Generic operations
  // ---------------------------------------------------------------------------

  apply(yaml: string): string {
    const fullCommand = `${this.kubectlPath} apply -f -`;
    try {
      const result = execSync(
        `${this.kubectlPath} ${this.getBaseArgs().join(" ")} apply -f -`,
        {
          input: yaml,
          stdio: ["pipe", "pipe", "pipe"],
          encoding: "utf-8",
          maxBuffer: 10 * 1024 * 1024,
        },
      );
      return result.trim();
    } catch (error: unknown) {
      if (error instanceof Error && "stderr" in error) {
        const stderr = (error as unknown as { stderr: Buffer | string }).stderr.toString();
        const status = (error as unknown as { status?: number | null }).status ?? null;
        throw new KubectlError(fullCommand, stderr, status);
      }
      throw error;
    }
  }

  deleteResource(ref: ResourceReference): string;
  deleteResource(resourceType: string, name: string, namespace?: string): string;
  deleteResource(resourceTypeOrRef: string | ResourceReference, name?: string, namespace?: string): string {
    let resourceType: string;
    let resourceName: string;
    let ns: string | undefined;

    if (typeof resourceTypeOrRef === "object") {
      resourceType = resourceTypeOrRef.kind.toLowerCase();
      resourceName = resourceTypeOrRef.name;
      ns = resourceTypeOrRef.namespace;
    } else {
      resourceType = resourceTypeOrRef;
      resourceName = name!;
      ns = namespace;
    }

    const args: string[] = ["delete", resourceType, resourceName];
    if (ns) args.push("-n", ns);
    return this.exec(...args);
  }

  getYaml(resourceType: string, name: string, namespace?: string): string {
    const args: string[] = ["get", resourceType, name, ...this.nsArgs(namespace), "-o", "yaml"];
    return this.exec(...args);
  }

  getJson(resourceType: string, name: string, namespace?: string): string {
    const args: string[] = ["get", resourceType, name, ...this.nsArgs(namespace), "-o", "json"];
    return this.exec(...args);
  }

  explain(resourceType: string, recusive?: boolean): string {
    const args: string[] = ["explain", resourceType];
    if (recusive) args.push("--recursive");
    return this.exec(...args);
  }

  validate(yaml: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const fullCommand = `${this.kubectlPath} apply --validate=true --dry-run=server -f -`;
      const result = execSync(
        `${this.kubectlPath} ${this.getBaseArgs().join(" ")} apply --validate=true --dry-run=server -f -`,
        {
          input: yaml,
          stdio: ["pipe", "pipe", "pipe"],
          encoding: "utf-8",
          maxBuffer: 10 * 1024 * 1024,
        },
      );
      const output = result.trim();
      const warningLines = output.split("\n").filter((l) => l.toLowerCase().includes("warning"));
      warnings.push(...warningLines);
    } catch (error: unknown) {
      if (error instanceof Error && "stderr" in error) {
        const stderr = (error as unknown as { stderr: Buffer | string }).stderr.toString();
        errors.push(stderr);
      } else {
        errors.push(String(error));
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  dryRun(yaml: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const result = execSync(
        `${this.kubectlPath} ${this.getBaseArgs().join(" ")} apply --validate=true --dry-run=client -f -`,
        {
          input: yaml,
          stdio: ["pipe", "pipe", "pipe"],
          encoding: "utf-8",
          maxBuffer: 10 * 1024 * 1024,
        },
      );
      const output = result.trim();
      const warningLines = output.split("\n").filter((l) => l.toLowerCase().includes("warning"));
      warnings.push(...warningLines);
    } catch (error: unknown) {
      if (error instanceof Error && "stderr" in error) {
        const stderr = (error as unknown as { stderr: Buffer | string }).stderr.toString();
        errors.push(stderr);
      } else {
        errors.push(String(error));
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  // ---------------------------------------------------------------------------
  // Convenience: list all resources in a namespace
  // ---------------------------------------------------------------------------

  getAllResources(namespace?: string): {
    pods: KubePod[];
    deployments: KubeDeployment[];
    services: KubeService[];
    configMaps: KubeConfigMap[];
    secrets: KubeSecret[];
    events: KubeEvent[];
  } {
    const ns = namespace ?? this.defaultNamespace;
    return {
      pods: this.listPods(ns),
      deployments: this.listDeployments(ns),
      services: this.listServices(ns),
      configMaps: this.listConfigMaps(ns),
      secrets: this.listSecrets(ns),
      events: this.listEvents(ns),
    };
  }

  getResourceSummary(namespace?: string): {
    podCount: number;
    deploymentCount: number;
    serviceCount: number;
    configMapCount: number;
    secretCount: number;
    nodeCount: number;
    eventCount: number;
  } {
    const ns = namespace ?? this.defaultNamespace;
    return {
      podCount: this.listPods(ns).length,
      deploymentCount: this.listDeployments(ns).length,
      serviceCount: this.listServices(ns).length,
      configMapCount: this.listConfigMaps(ns).length,
      secretCount: this.listSecrets(ns).length,
      nodeCount: this.listNodes().length,
      eventCount: this.listEvents(ns).length,
    };
  }

  // ---------------------------------------------------------------------------
  // Utility
  // ---------------------------------------------------------------------------

  getVersion(): { client: string; server?: string } {
    const raw = this.execJson<{ clientVersion: Record<string, string>; serverVersion?: Record<string, string> }>(
      "version",
      "-o",
      "json",
    );
    return {
      client: `${raw.clientVersion?.major ?? "?"}.${raw.clientVersion?.minor ?? "?"}`,
      server: raw.serverVersion
        ? `${raw.serverVersion.major}.${raw.serverVersion.minor}`
        : undefined,
    };
  }

  getApiResources(): string[] {
    const out = this.execJson<KubectlListResponse<{ name: string; kind: string; namespaced: boolean; verbs: string[] }>>(
      "api-resources",
    );
    return out.items.map((r) => r.name);
  }

  getContext(): string | undefined {
    return this.context;
  }

  getDefaultNamespace(): string {
    return this.defaultNamespace;
  }

  clusterInfo(): string {
    return this.exec("cluster-info");
  }

  authCanI(verb: string, resource: string, namespace?: string): boolean {
    const args: string[] = ["auth", "can-i", verb, resource];
    if (namespace) args.push("-n", namespace);
    try {
      const out = this.exec(...args);
      return out.toLowerCase().trim() === "yes";
    } catch {
      return false;
    }
  }

  waitForPod(
    name: string,
    condition: string = "Ready",
    namespace?: string,
    timeoutSeconds: number = 120,
  ): string {
    return this.exec(
      "wait",
      "--for",
      `condition=${condition}`,
      `pod/${name}`,
      ...this.nsArgs(namespace),
      `--timeout=${timeoutSeconds}s`,
    );
  }

  waitForDeployment(
    name: string,
    condition: string = "Available",
    namespace?: string,
    timeoutSeconds: number = 300,
  ): string {
    return this.exec(
      "wait",
      "--for",
      `condition=${condition}`,
      `deployment/${name}`,
      ...this.nsArgs(namespace),
      `--timeout=${timeoutSeconds}s`,
    );
  }

  label(
    resourceType: string,
    name: string,
    labels: Record<string, string>,
    namespace?: string,
  ): string {
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}=${v}`)
      .join(",");
    return this.exec("label", resourceType, name, labelStr, ...this.nsArgs(namespace), "--overwrite");
  }

  annotate(
    resourceType: string,
    name: string,
    annotations: Record<string, string>,
    namespace?: string,
  ): string {
    const annotateStr = Object.entries(annotations)
      .map(([k, v]) => `${k}=${v}`)
      .join(",");
    return this.exec("annotate", resourceType, name, annotateStr, ...this.nsArgs(namespace), "--overwrite");
  }

  portForward(
    resourceType: string,
    name: string,
    localPort: number,
    remotePort: number,
    namespace?: string,
  ): string {
    return this.exec(
      "port-forward",
      `${resourceType}/${name}`,
      `${localPort}:${remotePort}`,
      ...this.nsArgs(namespace),
    );
  }

  cp(source: string, destination: string, container?: string, namespace?: string): string {
    const args: string[] = ["cp", source, destination, ...this.nsArgs(namespace)];
    if (container) args.push("-c", container);
    return this.exec(...args);
  }

  logsFollow(
    name: string,
    namespace?: string,
    container?: string,
  ): { close: () => void } {
    const args: string[] = ["logs", "-f", name, ...this.nsArgs(namespace)];
    if (container) args.push("-c", container);

    const kubectlPath = this.kubectlPath;
    const finalArgs = [...this.getBaseArgs(), ...args];

    const proc = spawn(kubectlPath, finalArgs, {
      stdio: ["pipe", "pipe", "pipe"],
    });

    return {
      close: () => {
        proc.kill("SIGTERM");
      },
    };
  }
}
