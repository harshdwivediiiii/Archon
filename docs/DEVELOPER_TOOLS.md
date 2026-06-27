# Developer Tools Reference

## Overview

Archon includes a built-in suite of developer utilities accessible from the dashboard. These run entirely client-side with no external API calls.

**Source**: `lib/devtools/index.ts` — 387 lines.

## Available Tools

### 1. Regex Tester

Tests a regular expression against a string and shows match results.

```typescript
import { testRegex } from "@/lib/devtools";

const result = testRegex("\\d{3}-\\d{4}", "g", "Phone: 555-1234");
console.log(result.matches);    // true
console.log(result.matchResult); // "555-1234"
console.log(result.error);       // null (or error message if invalid)
```

**Features**:
- Supports all JS regex flags (`g`, `i`, `m`, `s`, `u`, `y`)
- Real-time match highlighting
- Error feedback for invalid patterns

### 2. JSON/YAML Formatter

Formats and pretty-prints JSON and YAML strings.

```typescript
import { formatJson, formatYaml } from "@/lib/devtools";

// JSON formatting
const jsonResult = formatJson('{"name":"test","value":42}');
console.log(jsonResult.result);
// {
//   "name": "test",
//   "value": 42
// }

// YAML formatting
const yamlResult = formatYaml("apiVersion: v1\nkind: Pod\nmetadata:\n  name: test\n");
console.log(yamlResult.result);
```

**Features**:
- JSON: syntax validation, pretty-print with 2-space indentation
- YAML: indentation correction, key-value formatting, sequence alignment
- Error messages for invalid input

### 3. Base64 Encoder/Decoder

Encodes and decodes Base64 strings.

```typescript
import { encodeBase64, decodeBase64 } from "@/lib/devtools";

const encoded = encodeBase64("Hello, World!");
console.log(encoded);  // "SGVsbG8sIFdvcmxkIQ=="

const decoded = decodeBase64(encoded);
console.log(decoded.result);  // "Hello, World!"
```

### 4. JWT Decoder

Decodes JSON Web Tokens without verification (reads header and payload only).

```typescript
import { decodeJWT } from "@/lib/devtools";

const result = decodeJWT("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...");
console.log(result.header);   // { alg: "HS256", typ: "JWT" }
console.log(result.payload);  // { sub: "...", iat: ..., exp: ... }
```

**Features**:
- Decodes Base64url-encoded header and payload
- Validates 3-segment JWT structure
- Parses both header and payload as JSON
- Returns detailed error messages for malformed tokens

### 5. UUID Generator

Generates UUID v4 or v7.

```typescript
import { generateUUID } from "@/lib/devtools";

const v4 = generateUUID("v4");   // Random UUID v4 (crypto.randomUUID())
const v7 = generateUUID("v7");   // Time-ordered UUID v7
```

**Features**:
- v4: cryptographically random (`crypto.randomUUID()`)
- v7: time-ordered with timestamp prefix (ms precision, 48-bit), suitable for database primary keys

### 6. Hash Generator

Computes cryptographic hashes of input strings.

```typescript
import { generateHash } from "@/lib/devtools";

const md5 = generateHash("hello", "md5");
const sha256 = generateHash("hello", "sha256");
const sha512 = generateHash("hello", "sha512");
```

**Supported algorithms**: `md5`, `sha1`, `sha256`, `sha512`

### 7. Cron Parser

Parses cron expressions and generates human-readable descriptions.

```typescript
import { parseCron } from "@/lib/devtools";

const result = parseCron("*/15 * * * *");
console.log(result.description);       // "every 15 minute(s), every hour, every day of month, every month, every day of week"
console.log(result.nextExecutions);     // Array of 5 upcoming ISO timestamps
console.log(result.isValid);            // true

// More complex expressions
parseCron("0 9 * * 1-5");      // "minute at 0, hour at 9, ..., day of week 1 through 5"
parseCron("0 0 1 1 *");        // "minute at 0, hour at 0, day of month at 1, month at 1, ..."
```

**Features**:
- Supports 5-field standard cron syntax
- Named months (`jan`, `feb`, ...) and days (`sun`, `mon`, ...)
- Step values (`*/15`), ranges (`1-5`), lists (`1,3,5`)
- Generates next 5 execution times
- Validation with clear error messages

### 8. SQL Formatter

Basic SQL keyword capitalization and indentation.

```typescript
import { formatSql } from "@/lib/devtools";

const result = formatSql("SELECT id, name FROM users WHERE age > 18 ORDER BY name");
console.log(result.result);
// SELECT
//   id, name
// FROM
//   users
// WHERE
//   age > 18
// ORDER BY
//   name
```

**Features**:
- Capitalizes SQL keywords (SELECT, FROM, WHERE, JOIN, etc.)
- Indents clauses with consistent spacing
- Handles commas, parentheses nesting
- Supports common SQL dialects (PostgreSQL, MySQL, SQLite)

## Dashboard Pages

The developer tools are available under `app/dashboard/developer-tools/` with a tabbed interface for each tool, providing:
- Input fields with real-time output preview
- Copy-to-clipboard for results
- Syntax validation feedback
- Batch processing support (where applicable)
