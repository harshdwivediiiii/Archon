import * as crypto from "node:crypto";

export function testRegex(
  pattern: string,
  flags: string,
  testString: string
): { matches: boolean; matchResult: string | null; error: string | null } {
  try {
    const regex = new RegExp(pattern, flags);
    const match = regex.exec(testString);
    return {
      matches: match !== null,
      matchResult: match ? match[0] : null,
      error: null,
    };
  } catch (err) {
    return {
      matches: false,
      matchResult: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function formatJson(input: string): { result: string | null; error: string | null } {
  try {
    const parsed = JSON.parse(input);
    return { result: JSON.stringify(parsed, null, 2), error: null };
  } catch (err) {
    return {
      result: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function formatYaml(input: string): { result: string | null; error: string | null } {
  try {
    const lines = input.split("\n");
    const output: string[] = [];
    let indent = 0;

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (!trimmed || trimmed.startsWith("#")) {
        output.push(trimmed ? lines[i] : "");
        continue;
      }

      if (trimmed.endsWith(":") || trimmed.endsWith("|") || trimmed.endsWith(">")) {
        output.push(" ".repeat(indent) + trimmed);
        if (trimmed.endsWith(":")) indent += 2;
        continue;
      }

      const colonIdx = trimmed.indexOf(":");
      if (colonIdx > 0) {
        const key = trimmed.slice(0, colonIdx).trimEnd();
        const val = trimmed.slice(colonIdx + 1).trimStart();
        if (val === "" || val.startsWith("#")) {
          output.push(" ".repeat(indent) + key + ": " + val);
          indent += 2;
        } else {
          output.push(" ".repeat(indent) + key + ": " + val);
        }
      } else if (trimmed.startsWith("- ")) {
        output.push(" ".repeat(Math.max(0, indent - 2)) + trimmed);
      } else {
        output.push(" ".repeat(indent) + trimmed);
      }
    }

    return { result: output.join("\n"), error: null };
  } catch (err) {
    return {
      result: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function encodeBase64(input: string): string {
  return Buffer.from(input, "utf-8").toString("base64");
}

export function decodeBase64(input: string): { result: string | null; error: string | null } {
  try {
    const decoded = Buffer.from(input, "base64").toString("utf-8");
    return { result: decoded, error: null };
  } catch (err) {
    return {
      result: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function decodeJWT(
  token: string
): {
  header: Record<string, unknown> | null;
  payload: Record<string, unknown> | null;
  error: string | null;
} {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return {
        header: null,
        payload: null,
        error: "Invalid JWT format: expected 3 dot-separated segments",
      };
    }

    const headerRaw = Buffer.from(parts[0]!, "base64url").toString("utf-8");
    const payloadRaw = Buffer.from(parts[1]!, "base64url").toString("utf-8");

    let header: Record<string, unknown>;
    let payload: Record<string, unknown>;

    try {
      header = JSON.parse(headerRaw) as Record<string, unknown>;
    } catch {
      return {
        header: null,
        payload: null,
        error: "Failed to parse JWT header JSON",
      };
    }

    try {
      payload = JSON.parse(payloadRaw) as Record<string, unknown>;
    } catch {
      return {
        header,
        payload: null,
        error: "Failed to parse JWT payload JSON",
      };
    }

    return { header, payload, error: null };
  } catch (err) {
    return {
      header: null,
      payload: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function generateUUID(format: "v4" | "v7" = "v4"): string {
  if (format === "v7") {
    const timestamp = BigInt(Date.now());
    const timeHex = timestamp.toString(16).padStart(12, "0");
    const randomBytes = crypto.randomBytes(8);
    const randomHex = randomBytes.toString("hex");
    const raw = timeHex + randomHex;
    return (
      raw.slice(0, 8) +
      "-" +
      raw.slice(8, 12) +
      "-7" +
      raw.slice(13, 16) +
      "-" +
      ((BigInt("0x" + raw.slice(16, 18)) & BigInt(0x3f)) | BigInt(0x80)).toString(16) +
      raw.slice(18, 20) +
      "-" +
      raw.slice(20, 32)
    );
  }
  return crypto.randomUUID();
}

export function generateHash(
  input: string,
  algorithm: "md5" | "sha1" | "sha256" | "sha512"
): string {
  return crypto.createHash(algorithm).update(input, "utf-8").digest("hex");
}

const CRON_FIELDS = ["minute", "hour", "day of month", "month", "day of week"] as const;

function describeCronField(value: string, field: string): string {
  if (value === "*") return `every ${field}`;
  if (value.includes("/")) {
    const [, step] = value.split("/");
    return `every ${step} ${field}(s)`;
  }
  if (value.includes(",")) {
    const parts = value.split(",");
    return `${field} at ${parts.join(", ")}`;
  }
  if (value.includes("-")) {
    const [start, end] = value.split("-");
    return `${field} ${start} through ${end}`;
  }
  return `${field} at ${value}`;
}

const MONTH_NAMES: Record<string, string> = {
  "1": "January", "2": "February", "3": "March", "4": "April",
  "5": "May", "6": "June", "7": "July", "8": "August",
  "9": "September", "10": "October", "11": "November", "12": "December",
  jan: "January", feb: "February", mar: "March", apr: "April",
  may: "May", jun: "June", jul: "July", aug: "August",
  sep: "September", oct: "October", nov: "November", dec: "December",
};

const DAY_NAMES: Record<string, string> = {
  "0": "Sunday", "1": "Monday", "2": "Tuesday", "3": "Wednesday",
  "4": "Thursday", "5": "Friday", "6": "Saturday", "7": "Sunday",
  sun: "Sunday", mon: "Monday", tue: "Tuesday", wed: "Wednesday",
  thu: "Thursday", fri: "Friday", sat: "Saturday",
};

export function parseCron(
  expression: string
): {
  description: string;
  nextExecutions: string[];
  isValid: boolean;
  error: string | null;
} {
  try {
    const parts = expression.trim().split(/\s+/);
    if (parts.length < 5 || parts.length > 6) {
      return {
        description: "",
        nextExecutions: [],
        isValid: false,
        error: "Cron expression must have 5 or 6 fields",
      };
    }

    const fields = parts.length === 6 ? parts.slice(1) : parts;
    const descriptions = fields.map((f, i) => describeCronField(f, CRON_FIELDS[i]!));
    const description = descriptions.join(", ");

    const now = new Date();
    const nextExecutions: string[] = [];
    let candidate = new Date(now);

    for (let i = 0; i < 5; i++) {
      candidate = new Date(candidate.getTime() + 60000);
      let attempts = 0;
      while (attempts < 525600) {
        attempts++;
        const minute = candidate.getMinutes();
        const hour = candidate.getHours();
        const dom = candidate.getDate();
        const month = candidate.getMonth() + 1;
        const dow = candidate.getDay();

        if (
          matchesCronField(fields[0]!, minute) &&
          matchesCronField(fields[1]!, hour) &&
          matchesCronField(fields[2]!, dom) &&
          matchesCronField(fields[3]!, month) &&
          matchesCronField(fields[4]!, dow)
        ) {
          nextExecutions.push(candidate.toISOString());
          break;
        }
        candidate = new Date(candidate.getTime() + 60000);
      }
    }

    return { description, nextExecutions, isValid: true, error: null };
  } catch (err) {
    return {
      description: "",
      nextExecutions: [],
      isValid: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function matchesCronField(field: string, value: number): boolean {
  if (field === "*") return true;

  const stepMatch = field.match(/^(\d+)(?:-(\d+))?\/(\d+)$/);
  if (stepMatch) {
    const start = stepMatch[1] ? parseInt(stepMatch[1], 10) : 0;
    const end = stepMatch[2] ? parseInt(stepMatch[2], 10) : 59;
    const step = parseInt(stepMatch[3]!, 10);
    if (value < start || value > end) return false;
    return (value - start) % step === 0;
  }

  if (field.includes(",")) {
    return field.split(",").some((p) => matchesCronField(p.trim(), value));
  }

  if (field.includes("-")) {
    const [start, end] = field.split("-").map((s) => parseInt(s, 10));
    return value >= start! && value <= end!;
  }

  const namedField = field.toLowerCase();
  if (MONTH_NAMES[namedField]) {
    const monthIndex = Object.entries(MONTH_NAMES).find(
      ([, v]) => v.toLowerCase() === namedField
    )?.[0];
    return parseInt(monthIndex!, 10) === value;
  }
  if (DAY_NAMES[namedField]) {
    const dayIndex = Object.entries(DAY_NAMES).find(
      ([, v]) => v.toLowerCase() === namedField
    )?.[0];
    return parseInt(dayIndex!, 10) === value;
  }

  return parseInt(field, 10) === value;
}

export function formatSql(
  input: string,
  dialect?: string
): { result: string | null; error: string | null } {
  try {
    const keywords = [
      "SELECT", "FROM", "WHERE", "AND", "OR", "INSERT", "INTO", "VALUES",
      "UPDATE", "SET", "DELETE", "CREATE", "TABLE", "ALTER", "DROP",
      "INDEX", "VIEW", "JOIN", "LEFT", "RIGHT", "INNER", "OUTER", "FULL",
      "ON", "AS", "ORDER BY", "GROUP BY", "HAVING", "LIMIT", "OFFSET",
      "UNION", "ALL", "DISTINCT", "CASE", "WHEN", "THEN", "ELSE", "END",
      "EXISTS", "IN", "NOT", "NULL", "IS", "LIKE", "BETWEEN", "INNER",
      "CROSS", "NATURAL", "USING", "EXCEPT", "INTERSECT", "WITH",
      "RECURSIVE", "RETURNING", "PRIMARY", "KEY", "FOREIGN", "REFERENCES",
      "CONSTRAINT", "DEFAULT", "CHECK", "UNIQUE", "CASCADE", "RESTRICT",
      "BEGIN", "COMMIT", "ROLLBACK", "TRANSACTION", "DECLARE", "CURSOR",
      "FETCH", "CLOSE", "OPEN", "EXECUTE", "FUNCTION", "PROCEDURE",
      "TRIGGER", "SCHEMA", "DATABASE", "GRANT", "REVOKE", "IF",
    ];

    const upperInput = input.toUpperCase().trim();
    const output: string[] = [];
    let depth = 0;

    const tokens = input.split(/(\s+|(?=[,()])|(?<=[,()]))/).filter(Boolean);

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]!;
      const upper = token.toUpperCase().trim();

      if (token === "(") {
        output.push(token);
        depth++;
        continue;
      }

      if (token === ")") {
        depth = Math.max(0, depth - 1);
        output.push(token);
        continue;
      }

      if (keywords.includes(upper) && token.trim()) {
        if (output.length > 0 && output[output.length - 1] !== "\n") {
          output.push("\n" + "  ".repeat(depth));
        }
        output.push(upper);
        continue;
      }

      if (token === ",") {
        output.push(",");
        if (tokens[i + 1] && !tokens[i + 1]!.startsWith("\n")) {
          output.push("\n" + "  ".repeat(depth));
        }
        continue;
      }

      if (token.trim()) {
        output.push(token);
      }
    }

    return { result: output.join("").trim(), error: null };
  } catch (err) {
    return {
      result: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
