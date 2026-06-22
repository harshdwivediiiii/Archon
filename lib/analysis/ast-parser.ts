import * as ts from "typescript";
import * as babel from "@babel/parser";
import type { DetectedModule } from "./types";

export interface AstInfo {
  functions: string[];
  classes: string[];
  interfaces: string[];
  imports: string[];
  exports: string[];
  decorators: string[];
  calls: string[];
}

export function parseAst(
  filePath: string,
  content: string
): AstInfo | null {
  const ext = filePath.split(".").pop()?.toLowerCase();
  if (!ext) return null;

  try {
    if (["ts", "tsx"].includes(ext)) {
      return parseTypeScript(content, ext === "tsx");
    }
    if (["js", "jsx", "mjs"].includes(ext)) {
      return parseJavaScript(content);
    }
    if (ext === "py") {
      return parsePython(content);
    }
    if (ext === "go") {
      return parseGo(content);
    }
    if (ext === "rs") {
      return parseRust(content);
    }
    if (ext === "java") {
      return parseJava(content);
    }
  } catch {
    return null;
  }

  return null;
}

function parseTypeScript(content: string, isJsx: boolean): AstInfo | null {
  const sourceFile = ts.createSourceFile(
    "temp.ts",
    content,
    ts.ScriptTarget.Latest,
    true,
    isJsx ? ts.ScriptKind.JSX : ts.ScriptKind.TS
  );

  const info: AstInfo = {
    functions: [],
    classes: [],
    interfaces: [],
    imports: [],
    exports: [],
    decorators: [],
    calls: [],
  };

  function visit(node: ts.Node) {
    if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
      if (node.name && ts.isIdentifier(node.name)) info.functions.push(node.name.text);
    }
    if (ts.isClassDeclaration(node) && node.name) {
      info.classes.push(node.name.text);
    }
    if (ts.isInterfaceDeclaration(node) && node.name) {
      info.interfaces.push(node.name.text);
    }
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier.getText().replace(/['"]/g, "");
      info.imports.push(moduleSpecifier);
    }
    if (ts.isExportAssignment(node)) {
      info.exports.push("default");
    }
    if (ts.isExportDeclaration(node)) {
      if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        for (const spec of node.exportClause.elements) {
          info.exports.push(spec.name.text);
        }
      }
      if (node.moduleSpecifier) {
        info.exports.push(`from ${node.moduleSpecifier.getText()}`);
      }
    }
    if (ts.isDecorator(node)) {
      const expr = node.expression;
      if (ts.isIdentifier(expr)) info.decorators.push(expr.text);
      else if (ts.isCallExpression(expr) && ts.isIdentifier(expr.expression)) {
        info.decorators.push(expr.expression.text);
      }
    }
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      info.calls.push(node.expression.text);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return info;
}

function parseJavaScript(content: string): AstInfo | null {
  const ast = babel.parse(content, {
    sourceType: "module",
    plugins: [
      "jsx",
      "typescript",
      "decorators-legacy",
      "classProperties",
      "optionalChaining",
      "nullishCoalescingOperator",
      "dynamicImport",
    ],
  });

  const info: AstInfo = {
    functions: [],
    classes: [],
    interfaces: [],
    imports: [],
    exports: [],
    decorators: [],
    calls: [],
  };

  function walk(node: Record<string, unknown>) {
    if (!node || typeof node !== "object") return;

    if (node.type === "ImportDeclaration") {
      info.imports.push((node.source as Record<string, unknown>).value as string);
    }
    if (node.type === "ExportNamedDeclaration" && node.declaration) {
      const decl = node.declaration as Record<string, unknown>;
      if (decl.id && (decl.id as Record<string, unknown>).name) {
        info.exports.push((decl.id as Record<string, unknown>).name as string);
      }
    }
    if (node.type === "ExportDefaultDeclaration" && node.declaration) {
      const decl = node.declaration as Record<string, unknown>;
      if (decl.id && (decl.id as Record<string, unknown>).name) {
        info.exports.push((decl.id as Record<string, unknown>).name as string);
      } else info.exports.push("default");
    }
    if (node.type === "FunctionDeclaration" && node.id) {
      info.functions.push((node.id as Record<string, string>).name);
    }
    if (node.type === "ClassDeclaration" && node.id) {
      info.classes.push((node.id as Record<string, string>).name);
    }
    if (node.type === "CallExpression" && (node.callee as Record<string, unknown>)?.name) {
      info.calls.push((node.callee as Record<string, string>).name);
    }
    if (node.type === "Decorator") {
      const expr = node.expression as Record<string, unknown>;
      const callee = expr?.callee as Record<string, string> | undefined;
      if (callee?.name) {
        info.decorators.push(callee.name);
      }
    }

    for (const key of Object.keys(node)) {
      if (key === "leadingComments" || key === "trailingComments") continue;
      if (Array.isArray(node[key])) {
        (node[key] as Array<Record<string, unknown>>).forEach((child) => walk(child));
      } else if (typeof node[key] === "object" && node[key] !== null) {
        walk(node[key] as Record<string, unknown>);
      }
    }
  }

  walk(ast as unknown as Record<string, unknown>);
  return info;
}

function parsePython(content: string): AstInfo | null {
  const info: AstInfo = {
    functions: [],
    classes: [],
    interfaces: [],
    imports: [],
    exports: [],
    decorators: [],
    calls: [],
  };

  const functionRegex = /^(?:async\s+)?def\s+(\w+)\s*\(/gm;
  let m;
  while ((m = functionRegex.exec(content)) !== null) {
    info.functions.push(m[1]);
  }

  const classRegex = /^class\s+(\w+)/gm;
  while ((m = classRegex.exec(content)) !== null) {
    info.classes.push(m[1]);
  }

  const importRegex = /^(?:from\s+(\S+)\s+)?import\s+(.+)$/gm;
  while ((m = importRegex.exec(content)) !== null) {
    if (m[1]) info.imports.push(`${m[1]}.${m[2].split(" as ")[0].split(",")[0].trim()}`);
    else info.imports.push(m[2].split(" as ")[0].split(",")[0].trim());
  }

  const decoratorRegex = /^@(\w+)/gm;
  while ((m = decoratorRegex.exec(content)) !== null) {
    info.decorators.push(m[1]);
  }

  return info;
}

function parseGo(content: string): AstInfo | null {
  const info: AstInfo = {
    functions: [],
    classes: [],
    interfaces: [],
    imports: [],
    exports: [],
    decorators: [],
    calls: [],
  };

  const funcRegex = /^func\s+(?:\([^)]+\)\s+)?(\w+)\s*\(/gm;
  let m;
  while ((m = funcRegex.exec(content)) !== null) {
    info.functions.push(m[1]);
  }

  const structRegex = /^type\s+(\w+)\s+struct/gm;
  while ((m = structRegex.exec(content)) !== null) {
    info.classes.push(m[1]);
  }

  const ifaceRegex = /^type\s+(\w+)\s+interface/gm;
  while ((m = ifaceRegex.exec(content)) !== null) {
    info.interfaces.push(m[1]);
  }

  const importRegex = /"(?:[\w./-]+)"/g;
  while ((m = importRegex.exec(content)) !== null) {
    info.imports.push(m[1]);
  }

  return info;
}

function parseRust(content: string): AstInfo | null {
  const info: AstInfo = {
    functions: [],
    classes: [],
    interfaces: [],
    imports: [],
    exports: [],
    decorators: [],
    calls: [],
  };

  const funcRegex = /^(?:pub\s+)?(?:unsafe\s+)?fn\s+(\w+)/gm;
  let m;
  while ((m = funcRegex.exec(content)) !== null) {
    info.functions.push(m[1]);
  }

  const structRegex = /^(?:pub\s+)?struct\s+(\w+)/gm;
  while ((m = structRegex.exec(content)) !== null) {
    info.classes.push(m[1]);
  }

  const traitRegex = /^(?:pub\s+)?trait\s+(\w+)/gm;
  while ((m = traitRegex.exec(content)) !== null) {
    info.interfaces.push(m[1]);
  }

  const useRegex = /^use\s+(.+?)(?:\s+as\s+.+)?;$/gm;
  while ((m = useRegex.exec(content)) !== null) {
    info.imports.push(m[1]);
  }

  return info;
}

function parseJava(content: string): AstInfo | null {
  const info: AstInfo = {
    functions: [],
    classes: [],
    interfaces: [],
    imports: [],
    exports: [],
    decorators: [],
    calls: [],
  };

  const classRegex = /(?:public\s+)?(?:abstract\s+)?(?:final\s+)?class\s+(\w+)/gm;
  let m;
  while ((m = classRegex.exec(content)) !== null) {
    info.classes.push(m[1]);
  }

  const ifaceRegex = /(?:public\s+)?interface\s+(\w+)/gm;
  while ((m = ifaceRegex.exec(content)) !== null) {
    info.interfaces.push(m[1]);
  }

  const importRegex = /^import\s+(.+?);$/gm;
  while ((m = importRegex.exec(content)) !== null) {
    info.imports.push(m[1]);
  }

  const methodRegex = /(?:public|private|protected)\s+(?:static\s+)?(?:\w+\s+)+(\w+)\s*\(/gm;
  while ((m = methodRegex.exec(content)) !== null) {
    info.functions.push(m[1]);
  }

  return info;
}

export function extractModules(
  filePath: string,
  content: string,
  ast: AstInfo | null
): DetectedModule[] {
  const fileName = filePath.split("/").pop() || "";
  const ext = filePath.split(".").pop() || "";

  if (!ast) return [];

  if (
    ast.imports.length === 0 &&
    ast.exports.length === 0 &&
    ast.functions.length === 0 &&
    ast.classes.length === 0
  ) {
    return [];
  }

  const typeMap: Record<string, "esm" | "cjs" | "python" | "go" | "rust" | "java"> = {
    ts: "esm",
    tsx: "esm",
    js: "esm",
    jsx: "esm",
    mjs: "esm",
    py: "python",
    go: "go",
    rs: "rust",
    java: "java",
  };

  return [
    {
      name: fileName.replace(/\.[^/.]+$/, ""),
      type: typeMap[ext] || "esm",
      exports: ast.exports,
      imports: ast.imports,
      sourceFile: filePath,
    },
  ];
}
