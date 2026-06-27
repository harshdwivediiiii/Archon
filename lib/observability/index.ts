import { randomUUID } from "crypto";

export const LogLevel = {
  Debug: "debug",
  Info: "info",
  Warn: "warn",
  Error: "error",
} as const;

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  metadata?: Record<string, unknown>;
  traceId?: string;
}

export interface Span {
  id: string;
  traceId: string;
  parentSpanId?: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: "ok" | "error";
  attributes: Record<string, unknown>;
}

export interface Trace {
  id: string;
  spans: Span[];
  startTime: number;
  endTime: number;
  duration: number;
  serviceName: string;
}

export interface Metric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  labels: Record<string, string>;
}

export type HealthStatus = "healthy" | "degraded" | "unhealthy";

export interface HealthCheck {
  name: string;
  status: HealthStatus;
  message: string;
  lastChecked: number;
  duration: number;
}

type LogFormatter = (entry: LogEntry) => string;

const LEVEL_NUM: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const DEFAULT_FORMATTER: LogFormatter = (entry) => {
  const base = `${entry.timestamp} [${entry.level.toUpperCase()}] [${entry.module}] ${entry.message}`;
  const parts: string[] = [base];
  if (entry.traceId) parts.push(`trace=${entry.traceId}`);
  if (entry.metadata && Object.keys(entry.metadata).length > 0) {
    parts.push(JSON.stringify(entry.metadata));
  }
  return parts.join(" ");
};

export class Logger {
  private readonly module: string;
  private readonly minLevel: LogLevel;
  private readonly formatter: LogFormatter;

  constructor(module: string, minLevel: LogLevel = "debug", formatter?: LogFormatter) {
    this.module = module;
    this.minLevel = minLevel;
    this.formatter = formatter ?? DEFAULT_FORMATTER;
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, unknown>, traceId?: string): void {
    if (LEVEL_NUM[level] < LEVEL_NUM[this.minLevel]) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module: this.module,
      message,
      metadata,
      traceId,
    };

    const output = this.formatter(entry);

    switch (level) {
      case "error":
        console.error(output);
        break;
      case "warn":
        console.warn(output);
        break;
      case "info":
        console.info(output);
        break;
      case "debug":
        console.debug(output);
        break;
    }
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log("debug", message, metadata);
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.log("info", message, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log("warn", message, metadata);
  }

  error(message: string, metadata?: Record<string, unknown>): void {
    this.log("error", message, metadata);
  }

  child(module: string): Logger {
    return new Logger(`${this.module}:${module}`, this.minLevel, this.formatter);
  }
}

interface ActiveSpan {
  span: Span;
  children: ActiveSpan[];
}

export class Tracer {
  private readonly serviceName: string;
  private readonly spans: Map<string, ActiveSpan> = new Map();
  private readonly traces: Map<string, Trace> = new Map();

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  startSpan(name: string, traceId?: string, parentSpanId?: string): Span {
    const id = randomUUID();
    const resolvedTraceId = traceId ?? randomUUID();

    const span: Span = {
      id,
      traceId: resolvedTraceId,
      parentSpanId,
      name,
      startTime: performance.now(),
      status: "ok",
      attributes: {},
    };

    const active: ActiveSpan = { span, children: [] };

    if (parentSpanId) {
      const parent = this.spans.get(parentSpanId);
      if (parent) {
        parent.children.push(active);
      }
    }

    this.spans.set(id, active);

    return span;
  }

  endSpan(span: Span, status: "ok" | "error" = "ok"): void {
    const now = performance.now();
    span.endTime = now;
    span.duration = now - span.startTime;
    span.status = status;

    this.flattenTrace(span.traceId);
  }

  setAttribute(span: Span, key: string, value: unknown): void {
    span.attributes[key] = value;
  }

  getTrace(traceId: string): Trace | undefined {
    return this.traces.get(traceId);
  }

  private flattenTrace(traceId: string): void {
    const allSpans: Span[] = [];
    let minStart = Infinity;
    let maxEnd = 0;

    Array.from(this.spans.values()).forEach((active) => {
      if (active.span.traceId === traceId) {
        allSpans.push(active.span);
        if (active.span.startTime < minStart) minStart = active.span.startTime;
        if (active.span.endTime && active.span.endTime > maxEnd) maxEnd = active.span.endTime;
      }
    });

    if (allSpans.length === 0) return;

    this.traces.set(traceId, {
      id: traceId,
      spans: allSpans.sort((a, b) => a.startTime - b.startTime),
      startTime: minStart,
      endTime: maxEnd,
      duration: maxEnd - minStart,
      serviceName: this.serviceName,
    });
  }
}

interface CounterMetric {
  name: string;
  value: number;
  unit: string;
  labels: Record<string, string>;
}

interface GaugeMetric {
  name: string;
  value: number;
  unit: string;
  labels: Record<string, string>;
}

interface HistogramMetric {
  name: string;
  values: number[];
  unit: string;
  labels: Record<string, string>;
}

export class MetricsCollector {
  private counters: Map<string, CounterMetric> = new Map();
  private gauges: Map<string, GaugeMetric> = new Map();
  private histograms: Map<string, HistogramMetric> = new Map();

  private key(name: string, labels: Record<string, string>): string {
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(",");
    return labelStr ? `${name}{${labelStr}}` : name;
  }

  recordCounter(name: string, value: number = 1, unit: string = "count", labels: Record<string, string> = {}): void {
    const k = this.key(name, labels);
    const existing = this.counters.get(k);
    if (existing) {
      existing.value += value;
    } else {
      this.counters.set(k, { name, value, unit, labels });
    }
  }

  recordGauge(name: string, value: number, unit: string = "value", labels: Record<string, string> = {}): void {
    const k = this.key(name, labels);
    this.gauges.set(k, { name, value, unit, labels });
  }

  recordHistogram(name: string, value: number, unit: string = "ms", labels: Record<string, string> = {}): void {
    const k = this.key(name, labels);
    const existing = this.histograms.get(k);
    if (existing) {
      existing.values.push(value);
    } else {
      this.histograms.set(k, { name, values: [value], unit, labels });
    }
  }

  getMetrics(): Metric[] {
    const metrics: Metric[] = [];
    const now = Date.now();

    Array.from(this.counters.values()).forEach((counter) => {
      metrics.push({
        name: counter.name,
        value: counter.value,
        unit: counter.unit,
        timestamp: now,
        labels: counter.labels,
      });
    });

    Array.from(this.gauges.values()).forEach((gauge) => {
      metrics.push({
        name: gauge.name,
        value: gauge.value,
        unit: gauge.unit,
        timestamp: now,
        labels: gauge.labels,
      });
    });

    Array.from(this.histograms.values()).forEach((histogram) => {
      const sorted = [...histogram.values].sort((a, b) => a - b);
      const p50 = sorted[Math.floor(sorted.length * 0.5)] ?? 0;
      const p90 = sorted[Math.floor(sorted.length * 0.9)] ?? 0;
      const p99 = sorted[Math.floor(sorted.length * 0.99)] ?? 0;

      metrics.push({
        name: `${histogram.name}_count`,
        value: histogram.values.length,
        unit: histogram.unit,
        timestamp: now,
        labels: histogram.labels,
      });
      metrics.push({
        name: `${histogram.name}_sum`,
        value: histogram.values.reduce((a, b) => a + b, 0),
        unit: histogram.unit,
        timestamp: now,
        labels: histogram.labels,
      });
      metrics.push({
        name: `${histogram.name}_avg`,
        value: histogram.values.length > 0 ? histogram.values.reduce((a, b) => a + b, 0) / histogram.values.length : 0,
        unit: histogram.unit,
        timestamp: now,
        labels: histogram.labels,
      });
      metrics.push({
        name: `${histogram.name}_p50`,
        value: p50,
        unit: histogram.unit,
        timestamp: now,
        labels: histogram.labels,
      });
      metrics.push({
        name: `${histogram.name}_p90`,
        value: p90,
        unit: histogram.unit,
        timestamp: now,
        labels: histogram.labels,
      });
      metrics.push({
        name: `${histogram.name}_p99`,
        value: p99,
        unit: histogram.unit,
        timestamp: now,
        labels: histogram.labels,
      });
    });

    return metrics;
  }

  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }
}

type HealthCheckFn = () => Promise<HealthCheckResult | HealthStatus>;

interface HealthCheckResult {
  status: HealthStatus;
  message?: string;
}

interface RegisteredCheck {
  name: string;
  fn: HealthCheckFn;
  interval: number;
  lastResult: HealthCheck;
  timer: ReturnType<typeof setInterval> | null;
}

export class HealthChecker {
  private checks: Map<string, RegisteredCheck> = new Map();
  private running = false;

  registerCheck(name: string, fn: HealthCheckFn, intervalMs: number = 30_000): void {
    if (this.checks.has(name)) {
      throw new Error(`Health check "${name}" is already registered`);
    }

    const check: RegisteredCheck = {
      name,
      fn,
      interval: intervalMs,
      lastResult: {
        name,
        status: "unhealthy",
        message: "Not yet checked",
        lastChecked: 0,
        duration: 0,
      },
      timer: null,
    };

    this.checks.set(name, check);
  }

  addCheck(name: string, fn: HealthCheckFn, intervalMs?: number): void {
    this.registerCheck(name, fn, intervalMs);
  }

  start(): void {
    if (this.running) return;
    this.running = true;

    Array.from(this.checks.values()).forEach((check) => {
      this.runCheck(check);
      if (check.interval > 0) {
        check.timer = setInterval(() => this.runCheck(check), check.interval);
      }
    });
  }

  stop(): void {
    this.running = false;
    Array.from(this.checks.values()).forEach((check) => {
      if (check.timer) {
        clearInterval(check.timer);
        check.timer = null;
      }
    });
  }

  private async runCheck(check: RegisteredCheck): Promise<void> {
    const start = performance.now();
    try {
      const result = await check.fn();
      const status = typeof result === "string" ? result : result.status;
      const message = typeof result === "string" ? "" : (result.message ?? "");

      check.lastResult = {
        name: check.name,
        status,
        message,
        lastChecked: Date.now(),
        duration: performance.now() - start,
      };
    } catch (error) {
      check.lastResult = {
        name: check.name,
        status: "unhealthy",
        message: error instanceof Error ? error.message : "Unknown error",
        lastChecked: Date.now(),
        duration: performance.now() - start,
      };
    }
  }

  async runChecks(): Promise<HealthCheck[]> {
    const checks = Array.from(this.checks.values());
    const results: HealthCheck[] = [];

    for (const check of checks) {
      await this.runCheck(check);
      results.push(check.lastResult);
    }

    return results;
  }

  getStatus(): HealthStatus {
    let hasDegraded = false;

    const checks = Array.from(this.checks.values());
    for (const check of checks) {
      if (check.lastResult.status === "unhealthy") return "unhealthy";
      if (check.lastResult.status === "degraded") hasDegraded = true;
    }

    return hasDegraded ? "degraded" : "healthy";
  }

  getCheck(name: string): HealthCheck | undefined {
    return this.checks.get(name)?.lastResult;
  }

  getAllChecks(): HealthCheck[] {
    return Array.from(this.checks.values()).map((c) => c.lastResult);
  }
}

export function observe<Args extends unknown[], Return>(
  fn: (...args: Args) => Return,
  options?: { name?: string; logger?: Logger; tracer?: Tracer; metrics?: MetricsCollector },
): (...args: Args) => Return {
  const name = options?.name ?? (fn.name || "anonymous");

  return (...args: Args): Return => {
    const logger = options?.logger;
    const tracer = options?.tracer;
    const metrics = options?.metrics;

    const span = tracer?.startSpan(name);
    const start = performance.now();

    try {
      const result = fn(...args);

      if (result instanceof Promise) {
        return (result as Promise<unknown>).then(
          (val) => {
            const duration = performance.now() - start;
            span && tracer?.endSpan(span, "ok");
            logger?.debug(`Completed ${name}`, { durationMs: Math.round(duration) });
            metrics?.recordHistogram("function_duration", duration, "ms", { function: name });
            return val;
          },
          (err) => {
            const duration = performance.now() - start;
            span && tracer?.endSpan(span, "error");
            logger?.error(`Failed ${name}`, { durationMs: Math.round(duration), error: String(err) });
            metrics?.recordHistogram("function_duration", duration, "ms", { function: name, error: "true" });
            throw err;
          },
        ) as Return;
      }

      const duration = performance.now() - start;
      span && tracer?.endSpan(span, "ok");
      logger?.debug(`Completed ${name}`, { durationMs: Math.round(duration) });
      metrics?.recordHistogram("function_duration", duration, "ms", { function: name });

      return result;
    } catch (error) {
      const duration = performance.now() - start;
      span && tracer?.endSpan(span, "error");
      logger?.error(`Failed ${name}`, { durationMs: Math.round(duration), error: String(error) });
      metrics?.recordHistogram("function_duration", duration, "ms", { function: name, error: "true" });
      throw error;
    }
  };
}
