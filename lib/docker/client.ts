import { execSync, exec, type ChildProcess } from "child_process";
import { PassThrough } from "stream";

export class DockerError extends Error {
  readonly cmd: string;
  readonly exitCode: number | null;
  readonly stderr: string;

  constructor(cmd: string, exitCode: number | null, stderr: string) {
    super(`Docker command failed: ${cmd}\n${stderr}`);
    this.name = "DockerError";
    this.cmd = cmd;
    this.exitCode = exitCode;
    this.stderr = stderr;
  }
}

export type DockerImageItem = {
  id: string;
  repository: string;
  tag: string;
  digest: string;
  created: string;
  size: string;
  sizeBytes: number;
};

export type DockerContainerItem = {
  id: string;
  name: string;
  image: string;
  imageId: string;
  command: string;
  created: string;
  state: string;
  status: string;
  ports: { hostIp: string; hostPort: number; containerPort: number; type: string }[];
  mounts: { type: string; source: string; destination: string; mode: string }[];
  networks: string[];
  labels: Record<string, string>;
};

export type DockerVolumeItem = {
  name: string;
  driver: string;
  mountpoint: string;
  scope: string;
  created: string;
  labels: Record<string, string>;
  size?: number;
};

export type DockerNetworkItem = {
  id: string;
  name: string;
  driver: string;
  scope: string;
  subnet: string;
  gateway: string;
  attachedContainers: { name: string; ip: string; mac: string }[];
  labels: Record<string, string>;
  created: string;
  internal: boolean;
};

export type ContainerStats = {
  cpuPercent: number;
  cpuSystemUsage: number;
  cpuTotalUsage: number;
  memoryUsage: number;
  memoryLimit: number;
  memoryPercent: number;
  networkRxBytes: number;
  networkTxBytes: number;
  blockReadBytes: number;
  blockWriteBytes: number;
  pids: number;
  timestamp: number;
};

export type ContainerLogs = {
  stdout: string;
  stderr: string;
};

export type ImageLayer = {
  id: string;
  created: string;
  createdBy: string;
  size: number;
  comment?: string;
};

export type SystemDFInfo = {
  imagesCount: number;
  imagesSize: number;
  containersCount: number;
  containersSize: number;
  volumesCount: number;
  volumesSize: number;
  buildCacheCount: number;
  buildCacheSize: number;
  totalSize: number;
  reclaimableSize: number;
};

export type DockerComposeProject = {
  name: string;
  status: string;
  configFiles: string[];
};

export type DockerExecResult = {
  exitCode: number | null;
  stdout: string;
  stderr: string;
};

function parseDockerJson<T>(cmd: string, stdout: string): T {
  try {
    return JSON.parse(stdout) as T;
  } catch {
    throw new DockerError(cmd, 0, `Failed to parse docker JSON output: ${stdout.slice(0, 500)}`);
  }
}

function parseDockerLines(cmd: string, stdout: string): Record<string, unknown>[] {
  const lines = stdout.trim().split("\n").filter(Boolean);
  return lines.map((line) => {
    try {
      return JSON.parse(line) as Record<string, unknown>;
    } catch {
      throw new DockerError(cmd, 0, `Failed to parse docker JSON line: ${line.slice(0, 500)}`);
    }
  });
}

function run(args: string[]): string {
  const cmd = `docker ${args.join(" ")}`;
  try {
    return execSync(`docker ${args.join(" ")}`, {
      encoding: "utf-8",
      maxBuffer: 50 * 1024 * 1024,
    });
  } catch (err: unknown) {
    if (err instanceof Error && "stderr" in err) {
      const stderr = (err as { stderr: string | Buffer }).stderr;
      const exitCode =
        "status" in err ? (err as { status: number | null }).status : null;
      throw new DockerError(
        cmd,
        exitCode,
        typeof stderr === "string" ? stderr : stderr?.toString() ?? ""
      );
    }
    throw new DockerError(cmd, null, err instanceof Error ? err.message : "Unknown error");
  }
}

function runJson<T>(args: string[]): T {
  return parseDockerJson<T>(args.join(" "), run([...args, "--format", "{{json .}}"]));
}

function runJsonLines(args: string[]): Record<string, unknown>[] {
  return parseDockerLines(args.join(" "), run([...args, "--format", "{{json .}}"]));
}

function formatSizeBytes(size: string): number {
  const match = size.match(/^([\d.]+)\s*(B|KB|MB|GB|TB)$/);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
    TB: 1024 * 1024 * 1024 * 1024,
  };
  return Math.round(value * (multipliers[unit] ?? 1));
}

export class DockerClient {
  private readonly dockerHost?: string;

  constructor(options?: { host?: string }) {
    this.dockerHost = options?.host;
  }

  private runEnv(args: string[]): string {
    const cmd = `docker ${args.join(" ")}`;
    try {
      return execSync(`docker ${args.join(" ")}`, {
        encoding: "utf-8",
        maxBuffer: 50 * 1024 * 1024,
        env: process.env,
      });
    } catch (err: unknown) {
      if (err instanceof Error && "stderr" in err) {
        const stderr = (err as { stderr: string | Buffer }).stderr;
        const exitCode =
          "status" in err ? (err as { status: number | null }).status : null;
        throw new DockerError(
          cmd,
          exitCode,
          typeof stderr === "string" ? stderr : stderr?.toString() ?? ""
        );
      }
      throw new DockerError(cmd, null, err instanceof Error ? err.message : "Unknown error");
    }
  }

  private runJsonEnv<T>(args: string[]): T {
    return parseDockerJson<T>(args.join(" "), this.runEnv([...args, "--format", "{{json .}}"]));
  }

  private runJsonLinesEnv(args: string[]): Record<string, unknown>[] {
    return parseDockerLines(args.join(" "), this.runEnv([...args, "--format", "{{json .}}"]));
  }

  private runAsync(args: string[]): ChildProcess {
    const proc = exec(`docker ${args.join(" ")}`, {
      encoding: "utf-8",
      maxBuffer: 50 * 1024 * 1024,
      env: process.env,
    });
    return proc;
  }

  // ---- Images ----

  listImages(options?: { all?: boolean; filters?: Record<string, string> }): DockerImageItem[] {
    const args = ["image", "ls", "--no-trunc"];
    if (options?.all) args.push("--all");
    if (options?.filters) {
      args.push("--filter", Object.entries(options.filters).map(([k, v]) => `${k}=${v}`).join(","));
    }
    const lines = this.runJsonLinesEnv(args);
    return lines.map((item) => ({
      id: (item.ID as string) ?? "",
      repository: (item.Repository as string) ?? "",
      tag: (item.Tag as string) ?? "",
      digest: (item.Digest as string) ?? "",
      created: (item.CreatedAt as string) ?? "",
      size: (item.Size as string) ?? "",
      sizeBytes: formatSizeBytes((item.Size as string) ?? ""),
    }));
  }

  inspectImage(imageRef: string): Record<string, unknown> {
    return this.runJsonEnv<Record<string, unknown>>(["image", "inspect", imageRef]);
  }

  removeImage(imageRef: string, options?: { force?: boolean }): void {
    const args = ["image", "rm"];
    if (options?.force) args.push("--force");
    args.push(imageRef);
    this.runEnv(args);
  }

  pruneImages(options?: { all?: boolean; filters?: Record<string, string> }): { spaceReclaimed: number } {
    const args = ["image", "prune", "--force"];
    if (options?.all) args.push("--all");
    if (options?.filters) {
      args.push("--filter", Object.entries(options.filters).map(([k, v]) => `${k}=${v}`).join(","));
    }
    const stdout = this.runEnv(args);
    const match = stdout.match(/ reclaimed (\d+)/);
    const spaceReclaimed = match ? parseInt(match[1], 10) : 0;
    return { spaceReclaimed };
  }

  getImageHistory(imageRef: string): ImageLayer[] {
    const lines = this.runJsonLinesEnv(["image", "history", imageRef]);
    return lines.map((layer) => ({
      id: (layer.ID as string) ?? "",
      created: (layer.CreatedAt as string) ?? "",
      createdBy: (layer.CreatedBy as string) ?? "",
      size: (layer.Size as number) ?? 0,
      comment: (layer.Comment as string) ?? undefined,
    }));
  }

  buildImage(options: {
    context: string;
    dockerfile?: string;
    tag?: string;
    buildArgs?: Record<string, string>;
    target?: string;
    cacheFrom?: string[];
    noCache?: boolean;
    platform?: string;
  }): string {
    const args = ["build"];
    if (options.dockerfile) args.push("--file", options.dockerfile);
    if (options.tag) args.push("--tag", options.tag);
    if (options.target) args.push("--target", options.target);
    if (options.noCache) args.push("--no-cache");
    if (options.platform) args.push("--platform", options.platform);
    if (options.buildArgs) {
      for (const [key, value] of Object.entries(options.buildArgs)) {
        args.push("--build-arg", `${key}=${value}`);
      }
    }
    if (options.cacheFrom) {
      for (const cache of options.cacheFrom) {
        args.push("--cache-from", cache);
      }
    }
    args.push(options.context);
    return this.runEnv(args);
  }

  // ---- Containers ----

  listContainers(options?: {
    all?: boolean;
    limit?: number;
    filters?: Record<string, string>;
  }): DockerContainerItem[] {
    const args = ["container", "ls", "--no-trunc"];
    if (options?.all) args.push("--all");
    if (options?.limit) args.push("--limit", String(options.limit));
    if (options?.filters) {
      args.push("--filter", Object.entries(options.filters).map(([k, v]) => `${k}=${v}`).join(","));
    }
    const lines = this.runJsonLinesEnv(args);
    return lines.map((item) => ({
      id: (item.ID as string) ?? "",
      name: (item.Names as string) ?? "",
      image: (item.Image as string) ?? "",
      imageId: (item.ImageID as string) ?? "",
      command: (item.Command as string) ?? "",
      created: (item.CreatedAt as string) ?? "",
      state: (item.State as string) ?? "",
      status: (item.Status as string) ?? "",
      ports: parsePorts(item.Ports as string | undefined),
      mounts: parseMounts(item.Mounts as string | undefined),
      networks: parseNetworks(item.Networks as string | undefined),
      labels: parseLabels(item.Labels as string | undefined),
    }));
  }

  inspectContainer(containerId: string): Record<string, unknown> {
    return this.runJsonEnv<Record<string, unknown>>(["container", "inspect", containerId]);
  }

  startContainer(containerId: string): void {
    this.runEnv(["container", "start", containerId]);
  }

  stopContainer(containerId: string, options?: { timeout?: number }): void {
    const args = ["container", "stop"];
    if (options?.timeout) args.push("--time", String(options.timeout));
    args.push(containerId);
    this.runEnv(args);
  }

  restartContainer(containerId: string, options?: { timeout?: number }): void {
    const args = ["container", "restart"];
    if (options?.timeout) args.push("--time", String(options.timeout));
    args.push(containerId);
    this.runEnv(args);
  }

  removeContainer(containerId: string, options?: { force?: boolean; volumes?: boolean }): void {
    const args = ["container", "rm"];
    if (options?.force) args.push("--force");
    if (options?.volumes) args.push("--volumes");
    args.push(containerId);
    this.runEnv(args);
  }

  getContainerLogs(
    containerId: string,
    options?: {
      tail?: number;
      since?: string;
      until?: string;
      timestamps?: boolean;
    }
  ): ContainerLogs {
    const args = ["container", "logs"];
    if (options?.tail !== undefined) args.push("--tail", String(options.tail));
    if (options?.since) args.push("--since", options.since);
    if (options?.until) args.push("--until", options.until);
    if (options?.timestamps) args.push("--timestamps");
    args.push(containerId);

    const stdout = this.runEnv([...args, "--stderr"]);
    const stderrOutput = this.runEnv([...args.filter((a) => a !== "--stderr"), "--stderr"]);
    return { stdout, stderr: stderrOutput };
  }

  followContainerLogs(
    containerId: string,
    options?: {
      tail?: number;
      since?: string;
      timestamps?: boolean;
    }
  ): { stdout: PassThrough; stderr: PassThrough; process: ChildProcess } {
    const args = ["container", "logs", "--follow"];
    if (options?.tail !== undefined) args.push("--tail", String(options.tail));
    if (options?.since) args.push("--since", options.since);
    if (options?.timestamps) args.push("--timestamps");
    args.push(containerId);

    const proc = this.runAsync(args);
    const stdoutStream = new PassThrough();
    const stderrStream = new PassThrough();

    if (proc.stdout) {
      proc.stdout.on("data", (data: string) => stdoutStream.write(data));
    }
    if (proc.stderr) {
      proc.stderr.on("data", (data: string) => {
        stderrStream.write(data);
      });
    }
    proc.on("error", (err: Error) => {
      stdoutStream.destroy(err);
      stderrStream.destroy(err);
    });

    return { stdout: stdoutStream, stderr: stderrStream, process: proc };
  }

  getContainerStats(containerId: string): ContainerStats {
    const raw = this.runJsonEnv<Record<string, unknown>>([
      "container",
      "stats",
      containerId,
      "--no-stream",
    ]);
    return parseStats(raw);
  }

  streamContainerStats(containerId: string, callback: (stats: ContainerStats) => void): () => void {
    const proc = exec(
      `docker ${["container", "stats", containerId, "--no-trunc", "--format", "{{json .}}"].join(" ")}`,
      {
        encoding: "utf-8",
        maxBuffer: 50 * 1024 * 1024,
        env: process.env,
      }
    );
    let buffer = "";
    const onData = (data: string) => {
      buffer += data;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const raw = JSON.parse(line) as Record<string, unknown>;
          callback(parseStats(raw));
        } catch {
          void 0;
        }
      }
    };
    proc.stdout?.on("data", onData);
    proc.stderr?.on("data", onData);
    return () => proc.kill();
  }

  execInContainer(
    containerId: string,
    command: string[],
    options?: {
      user?: string;
      workdir?: string;
      env?: Record<string, string>;
      privileged?: boolean;
    }
  ): DockerExecResult {
    const args = ["container", "exec"];
    if (options?.user) args.push("--user", options.user);
    if (options?.workdir) args.push("--workdir", options.workdir);
    if (options?.privileged) args.push("--privileged");
    if (options?.env) {
      for (const [key, value] of Object.entries(options.env)) {
        args.push("--env", `${key}=${value}`);
      }
    }
    args.push(containerId, ...command);
    const cmdStr = args.join(" ");
    try {
      const stdout = this.runEnv(args);
      return { exitCode: 0, stdout, stderr: "" };
    } catch (err) {
      if (err instanceof DockerError) {
        return { exitCode: err.exitCode ?? 1, stdout: "", stderr: err.stderr };
      }
      return { exitCode: 1, stdout: "", stderr: (err as Error).message };
    }
  }

  // ---- Volumes ----

  listVolumes(options?: { filters?: Record<string, string> }): DockerVolumeItem[] {
    const args = ["volume", "ls"];
    if (options?.filters) {
      args.push("--filter", Object.entries(options.filters).map(([k, v]) => `${k}=${v}`).join(","));
    }
    const lines = this.runJsonLinesEnv(args);
    return lines.map((item) => ({
      name: (item.Name as string) ?? "",
      driver: (item.Driver as string) ?? "",
      mountpoint: (item.Mountpoint as string) ?? "",
      scope: (item.Scope as string) ?? "",
      created: (item.CreatedAt as string) ?? "",
      labels: parseLabels(item.Labels as string | undefined),
      size: item.Size as number | undefined,
    }));
  }

  inspectVolume(volumeName: string): Record<string, unknown> {
    return this.runJsonEnv<Record<string, unknown>>(["volume", "inspect", volumeName]);
  }

  createVolume(options?: {
    name?: string;
    driver?: string;
    labels?: Record<string, string>;
    driverOpts?: Record<string, string>;
  }): Record<string, unknown> {
    const args = ["volume", "create"];
    if (options?.driver) args.push("--driver", options.driver);
    if (options?.labels) {
      for (const [key, value] of Object.entries(options.labels)) {
        args.push("--label", `${key}=${value}`);
      }
    }
    if (options?.driverOpts) {
      for (const [key, value] of Object.entries(options.driverOpts)) {
        args.push("--opt", `${key}=${value}`);
      }
    }
    if (options?.name) args.push(options.name);
    return parseDockerJson<Record<string, unknown>>(args.join(" "), this.runEnv(args));
  }

  removeVolume(volumeName: string, options?: { force?: boolean }): void {
    const args = ["volume", "rm"];
    if (options?.force) args.push("--force");
    args.push(volumeName);
    this.runEnv(args);
  }

  pruneVolumes(options?: { filters?: Record<string, string> }): { spaceReclaimed: number } {
    const args = ["volume", "prune", "--force"];
    if (options?.filters) {
      args.push("--filter", Object.entries(options.filters).map(([k, v]) => `${k}=${v}`).join(","));
    }
    const stdout = this.runEnv(args);
    const match = stdout.match(/ reclaimed (\d+)/);
    const spaceReclaimed = match ? parseInt(match[1], 10) : 0;
    return { spaceReclaimed };
  }

  // ---- Networks ----

  listNetworks(options?: { filters?: Record<string, string> }): DockerNetworkItem[] {
    const args = ["network", "ls", "--no-trunc"];
    if (options?.filters) {
      args.push("--filter", Object.entries(options.filters).map(([k, v]) => `${k}=${v}`).join(","));
    }
    const lines = this.runJsonLinesEnv(args);
    return lines.map((item) => ({
      id: (item.ID as string) ?? "",
      name: (item.Name as string) ?? "",
      driver: (item.Driver as string) ?? "",
      scope: (item.Scope as string) ?? "",
      subnet: (item.Subnet as string) ?? "",
      gateway: (item.Gateway as string) ?? "",
      attachedContainers: parseAttachedContainers(item.Containers as string | undefined),
      labels: parseLabels(item.Labels as string | undefined),
      created: (item.CreatedAt as string) ?? "",
      internal: (item.Internal as boolean) ?? false,
    }));
  }

  inspectNetwork(networkId: string): Record<string, unknown> {
    return this.runJsonEnv<Record<string, unknown>>(["network", "inspect", networkId]);
  }

  createNetwork(options?: {
    name: string;
    driver?: string;
    subnet?: string;
    gateway?: string;
    ipRange?: string;
    internal?: boolean;
    labels?: Record<string, string>;
    attachable?: boolean;
  }): Record<string, unknown> {
    const args = ["network", "create"];
    if (options?.driver) args.push("--driver", options.driver);
    if (options?.subnet) args.push("--subnet", options.subnet);
    if (options?.gateway) args.push("--gateway", options.gateway);
    if (options?.ipRange) args.push("--ip-range", options.ipRange);
    if (options?.internal) args.push("--internal");
    if (options?.attachable) args.push("--attachable");
    if (options?.labels) {
      for (const [key, value] of Object.entries(options.labels)) {
        args.push("--label", `${key}=${value}`);
      }
    }
    args.push(options?.name ?? "");
    return parseDockerJson<Record<string, unknown>>(args.join(" "), this.runEnv(args));
  }

  removeNetwork(networkId: string): void {
    this.runEnv(["network", "rm", networkId]);
  }

  pruneNetworks(options?: { filters?: Record<string, string> }): { networksRemoved: number } {
    const args = ["network", "prune", "--force"];
    if (options?.filters) {
      args.push("--filter", Object.entries(options.filters).map(([k, v]) => `${k}=${v}`).join(","));
    }
    const stdout = this.runEnv(args);
    const match = stdout.match(/Deleted Networks:\n/);
    return { networksRemoved: match ? stdout.split("\n").length - 2 : 0 };
  }

  // ---- System ----

  systemDf(options?: { verbose?: boolean }): SystemDFInfo {
    const args = ["system", "df"];
    if (options?.verbose) args.push("--verbose");
    const raw = this.runJsonEnv<Record<string, unknown>>(args);
    const layers = raw.Layers as Record<string, unknown>[] | undefined;
    const images = raw.Images as Record<string, unknown>[] | undefined;
    const containers = raw.Containers as Record<string, unknown>[] | undefined;
    const volumes = raw.Volumes as Record<string, unknown>[] | undefined;
    const buildCache = raw.BuildCache as Record<string, unknown>[] | undefined;

    return {
      imagesCount: images?.length ?? 0,
      imagesSize: (raw.ImagesSizeBytes as number) ?? 0,
      containersCount: containers?.length ?? 0,
      containersSize: (raw.ContainersSizeBytes as number) ?? 0,
      volumesCount: volumes?.length ?? 0,
      volumesSize: (raw.VolumesSizeBytes as number) ?? 0,
      buildCacheCount: buildCache?.length ?? 0,
      buildCacheSize: (raw.BuildCacheSizeBytes as number) ?? 0,
      totalSize: (raw.TotalSizeBytes as number) ?? 0,
      reclaimableSize: (raw.ReclaimableSizeBytes as number) ?? 0,
    };
  }

  // ---- Compose ----

  composeUp(options?: {
    projectName?: string;
    configFile?: string;
    detach?: boolean;
    build?: boolean;
    removeOrphans?: boolean;
    envFile?: string;
    profiles?: string[];
    services?: string[];
  }): string {
    const args = ["compose"];
    if (options?.projectName) args.push("--project-name", options.projectName);
    if (options?.configFile) args.push("--file", options.configFile);
    if (options?.envFile) args.push("--env-file", options.envFile);
    if (options?.profiles) {
      for (const profile of options.profiles) {
        args.push("--profile", profile);
      }
    }
    args.push("up");
    if (options?.detach) args.push("--detach");
    if (options?.build) args.push("--build");
    if (options?.removeOrphans) args.push("--remove-orphans");
    if (options?.services) args.push(...options.services);
    return this.runEnv(args);
  }

  composeDown(options?: {
    projectName?: string;
    configFile?: string;
    volumes?: boolean;
    removeOrphans?: boolean;
    timeout?: number;
  }): string {
    const args = ["compose"];
    if (options?.projectName) args.push("--project-name", options.projectName);
    if (options?.configFile) args.push("--file", options.configFile);
    args.push("down");
    if (options?.volumes) args.push("--volumes");
    if (options?.removeOrphans) args.push("--remove-orphans");
    if (options?.timeout) args.push("--timeout", String(options.timeout));
    return this.runEnv(args);
  }

  composePs(options?: {
    projectName?: string;
    configFile?: string;
    all?: boolean;
  }): DockerComposeProject[] {
    const args = ["compose"];
    if (options?.projectName) args.push("--project-name", options.projectName);
    if (options?.configFile) args.push("--file", options.configFile);
    args.push("ps");
    if (options?.all) args.push("--all");
    args.push("--format", "json");
    const stdout = this.runEnv(args);
    const lines = stdout.trim().split("\n").filter(Boolean);
    if (lines.length === 0) return [];
    const parsed = lines.map((l) => {
      try {
        return JSON.parse(l) as Record<string, unknown>;
      } catch {
        return null;
      }
    }).filter(Boolean) as Record<string, unknown>[];
    return parsed.map((item) => ({
      name: (item.Name as string) ?? "",
      status: (item.Status as string) ?? "",
      configFiles: [],
    }));
  }

  composeLogs(options?: {
    projectName?: string;
    configFile?: string;
    tail?: number;
    follow?: boolean;
    timestamps?: boolean;
    services?: string[];
  }): string | { stdout: PassThrough; stderr: PassThrough; process: ChildProcess } {
    const args = ["compose"];
    if (options?.projectName) args.push("--project-name", options.projectName);
    if (options?.configFile) args.push("--file", options.configFile);
    args.push("logs");
    if (options?.tail !== undefined) args.push("--tail", String(options.tail));
    if (options?.timestamps) args.push("--timestamps");
    if (options?.services) args.push(...options.services);

    if (options?.follow) {
      args.push("--follow");
      const proc = this.runAsync(args);
      const stdoutStream = new PassThrough();
      const stderrStream = new PassThrough();
      if (proc.stdout) {
        proc.stdout.on("data", (data: string) => stdoutStream.write(data));
      }
      if (proc.stderr) {
        proc.stderr.on("data", (data: string) => stderrStream.write(data));
      }
      proc.on("error", (err: Error) => {
        stdoutStream.destroy(err);
        stderrStream.destroy(err);
      });
      return { stdout: stdoutStream, stderr: stderrStream, process: proc };
    }

    return this.runEnv(args);
  }

  composeExec(
    serviceName: string,
    command: string[],
    options?: {
      projectName?: string;
      configFile?: string;
      index?: number;
      user?: string;
      workdir?: string;
      env?: Record<string, string>;
      privileged?: boolean;
      tty?: boolean;
    }
  ): DockerExecResult {
    const args = ["compose"];
    if (options?.projectName) args.push("--project-name", options.projectName);
    if (options?.configFile) args.push("--file", options.configFile);
    args.push("exec");
    if (options?.index) args.push("--index", String(options.index));
    if (options?.user) args.push("--user", options.user);
    if (options?.workdir) args.push("--workdir", options.workdir);
    if (options?.privileged) args.push("--privileged");
    if (options?.tty) args.push("--tty");
    if (options?.env) {
      for (const [key, value] of Object.entries(options.env)) {
        args.push("--env", `${key}=${value}`);
      }
    }
    args.push(serviceName, ...command);
    const cmdStr = args.join(" ");
    try {
      const stdout = this.runEnv(args);
      return { exitCode: 0, stdout, stderr: "" };
    } catch (err) {
      if (err instanceof DockerError) {
        return { exitCode: err.exitCode ?? 1, stdout: "", stderr: err.stderr };
      }
      return { exitCode: 1, stdout: "", stderr: (err as Error).message };
    }
  }
}

function parsePorts(ports: string | undefined): DockerContainerItem["ports"] {
  if (!ports || ports === "null") return [];
  try {
    const parsed = JSON.parse(ports) as Array<{
      IP?: string;
      PublicPort?: number;
      PrivatePort?: number;
      Type?: string;
    }>;
    return parsed.map((p) => ({
      hostIp: p.IP ?? "",
      hostPort: p.PublicPort ?? 0,
      containerPort: p.PrivatePort ?? 0,
      type: p.Type ?? "",
    }));
  } catch {
    return [];
  }
}

function parseMounts(mounts: string | undefined): DockerContainerItem["mounts"] {
  if (!mounts || mounts === "null") return [];
  try {
    const parsed = JSON.parse(mounts) as Array<{
      Type?: string;
      Source?: string;
      Destination?: string;
      Mode?: string;
    }>;
    return parsed.map((m) => ({
      type: m.Type ?? "",
      source: m.Source ?? "",
      destination: m.Destination ?? "",
      mode: m.Mode ?? "",
    }));
  } catch {
    return [];
  }
}

function parseNetworks(networks: string | undefined): string[] {
  if (!networks || networks === "null") return [];
  try {
    const parsed = JSON.parse(networks) as Record<string, unknown>;
    return Object.keys(parsed);
  } catch {
    return [];
  }
}

function parseLabels(labels: string | undefined): Record<string, string> {
  if (!labels || labels === "null") return {};
  try {
    return JSON.parse(labels) as Record<string, string>;
  } catch {
    return {};
  }
}

function parseAttachedContainers(
  containers: string | undefined
): DockerNetworkItem["attachedContainers"] {
  if (!containers || containers === "null") return [];
  try {
    const parsed = JSON.parse(containers) as Record<string, { Name?: string; IPv4Address?: string; MacAddress?: string }>;
    return Object.values(parsed).map((c) => ({
      name: c.Name ?? "",
      ip: c.IPv4Address ?? "",
      mac: c.MacAddress ?? "",
    }));
  } catch {
    return [];
  }
}

function parseStats(raw: Record<string, unknown>): ContainerStats {
  const cpuPercent = parseFloat(
    (raw.CPUPerc as string)?.replace("%", "") ?? "0"
  );
  const memUsage = (raw.MemUsage as string) ?? "";
  const memParts = memUsage.split("/");
  const netIO = (raw.NetIO as string) ?? "";
  const netParts = netIO.split("/");
  const blockIO = (raw.BlockIO as string) ?? "";
  const blockParts = blockIO.split("/");

  return {
    cpuPercent,
    cpuSystemUsage:
      typeof raw.CPUSystemUsage === "string"
        ? parseInt(raw.CPUSystemUsage, 10)
        : (raw.CPUSystemUsage as number) ?? 0,
    cpuTotalUsage:
      typeof raw.CPUUsage === "string"
        ? parseInt(raw.CPUUsage, 10)
        : (raw.CPUUsage as number) ?? 0,
    memoryUsage: parseBytes(memParts[0]?.trim() ?? "0"),
    memoryLimit: parseBytes(memParts[1]?.trim() ?? "0"),
    memoryPercent: parseFloat(
      (raw.MemPerc as string)?.replace("%", "") ?? "0"
    ),
    networkRxBytes: parseBytes(netParts[0]?.trim() ?? "0"),
    networkTxBytes: parseBytes(netParts[1]?.trim() ?? "0"),
    blockReadBytes: parseBytes(blockParts[0]?.trim() ?? "0"),
    blockWriteBytes: parseBytes(blockParts[1]?.trim() ?? "0"),
    pids: parseInt((raw.PIDs as string) ?? "0", 10),
    timestamp: Date.now(),
  };
}

function parseBytes(input: string): number {
  const trimmed = input.trim();
  const match = trimmed.match(/^([\d.]+)\s*(B|KiB|MiB|GiB|TiB|kB|MB|GB|TB)?$/i);
  if (!match) {
    const num = parseFloat(trimmed);
    return isNaN(num) ? 0 : num;
  }
  const value = parseFloat(match[1]);
  const unit = match[2]?.toUpperCase() ?? "B";
  const multipliers: Record<string, number> = {
    B: 1,
    KIB: 1024,
    MIB: 1024 * 1024,
    GIB: 1024 * 1024 * 1024,
    TIB: 1024 * 1024 * 1024 * 1024,
    KB: 1000,
    MB: 1000 * 1000,
    GB: 1000 * 1000 * 1000,
    TB: 1000 * 1000 * 1000 * 1000,
  };
  return Math.round(value * (multipliers[unit] ?? 1));
}
