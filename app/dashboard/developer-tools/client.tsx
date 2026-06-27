"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import {
  Regex,
  FileJson,
  FileType,
  ScanLine,
  Fingerprint,
  Hash,
  Clock,
  Combine,
  Terminal,
  Copy,
  Check,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface ToolResult {
  result?: string;
  error?: string;
  [key: string]: unknown;
}

export function DeveloperToolsClient() {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, ToolResult | null>>({});

  const [regexPattern, setRegexPattern] = useState("");
  const [regexFlags, setRegexFlags] = useState("");
  const [regexTestString, setRegexTestString] = useState("");

  const [jsonInput, setJsonInput] = useState("");
  const [yamlInput, setYamlInput] = useState("");
  const [base64Input, setBase64Input] = useState("");
  const [base64Mode, setBase64Mode] = useState<"encode" | "decode">("encode");
  const [jwtInput, setJwtInput] = useState("");

  const [uuidFormat, setUuidFormat] = useState("v4");
  const [uuidGenerated, setUuidGenerated] = useState("");

  const [hashInput, setHashInput] = useState("");
  const [hashAlgorithm, setHashAlgorithm] = useState("sha256");

  const [cronInput, setCronInput] = useState("");

  const [sqlInput, setSqlInput] = useState("");

  const [copied, setCopied] = useState<string | null>(null);

  const runTool = async (tool: string, params: Record<string, unknown>) => {
    setLoading(tool);
    setResults((prev) => ({ ...prev, [tool]: null }));
    try {
      const res = await fetch("/api/devtools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool, ...params }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Tool execution failed");
      }
      const data: ToolResult = await res.json();
      setResults((prev) => ({ ...prev, [tool]: data }));
    } catch (e) {
      setResults((prev) => ({
        ...prev,
        [tool]: { error: e instanceof Error ? e.message : "Tool failed" },
      }));
    } finally {
      setLoading(null);
    }
  };

  const runRegex = () => runTool("regex", { pattern: regexPattern, flags: regexFlags, testString: regexTestString });
  const runJsonFormat = () => runTool("json-format", { input: jsonInput });
  const runYamlFormat = () => runTool("yaml-format", { input: yamlInput });
  const runBase64 = () => runTool("base64", { input: base64Input, mode: base64Mode });
  const runJwtDecode = () => runTool("jwt-decode", { token: jwtInput });
  const runUuidGenerate = () => { const uuid = crypto.randomUUID(); setUuidGenerated(uuid); };
  const runHash = () => runTool("hash", { input: hashInput, algorithm: hashAlgorithm });
  const runCronParse = () => runTool("cron-parse", { expression: cronInput });
  const runSqlFormat = () => runTool("sql-format", { input: sqlInput });

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch { /* ignore */ }
  };

  const tools: { id: string; title: string; description: string; icon: React.ReactNode }[] = [
    { id: "regex", title: "Regex Tester", description: "Test regular expressions against strings", icon: <Regex className="h-5 w-5 text-blue-400" /> },
    { id: "json-format", title: "JSON Formatter", description: "Format and validate JSON data", icon: <FileJson className="h-5 w-5 text-emerald-400" /> },
    { id: "yaml-format", title: "YAML Formatter", description: "Format and validate YAML data", icon: <FileType className="h-5 w-5 text-amber-400" /> },
    { id: "base64", title: "Base64 Encoder/Decoder", description: "Encode or decode Base64 strings", icon: <ScanLine className="h-5 w-5 text-purple-400" /> },
    { id: "jwt-decode", title: "JWT Decoder", description: "Decode JWT tokens without verification", icon: <Fingerprint className="h-5 w-5 text-rose-400" /> },
    { id: "uuid", title: "UUID Generator", description: "Generate random UUIDs (v4/v7)", icon: <Combine className="h-5 w-5 text-cyan-400" /> },
    { id: "hash", title: "Hash Generator", description: "Generate hashes with various algorithms", icon: <Hash className="h-5 w-5 text-orange-400" /> },
    { id: "cron", title: "Cron Parser", description: "Parse cron expressions and get descriptions", icon: <Clock className="h-5 w-5 text-indigo-400" /> },
    { id: "sql-format", title: "SQL Formatter", description: "Format and beautify SQL queries", icon: <Terminal className="h-5 w-5 text-sky-400" /> },
  ];

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Developer Tools</h1>
          <p className="text-zinc-400">Utility tools for development and debugging</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    {tool.icon}
                    <div>
                      <CardTitle className="text-sm">{tool.title}</CardTitle>
                      <CardDescription className="text-xs">{tool.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tool.id === "regex" && (
                    <>
                      <Input placeholder="Pattern (e.g. \\d+)" value={regexPattern} onChange={(e) => setRegexPattern(e.target.value)} className="font-mono text-xs" />
                      <Input placeholder="Flags (e.g. gi)" value={regexFlags} onChange={(e) => setRegexFlags(e.target.value)} className="font-mono text-xs" />
                      <Textarea placeholder="Test string" value={regexTestString} onChange={(e) => setRegexTestString(e.target.value)} className="font-mono text-xs min-h-[60px]" />
                      <Button size="sm" onClick={runRegex} disabled={loading === "regex" || !regexPattern} className="w-full">
                        {loading === "regex" ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                        Test Regex
                      </Button>
                      {results.regex && (
                        <div className="rounded-lg border border-zinc-800 bg-black/30 p-3">
                          {results.regex.error ? (
                            <p className="text-xs text-red-400">{results.regex.error}</p>
                          ) : (
                            <div className="space-y-1">
                              <p className="text-xs text-zinc-400">Matches: {JSON.stringify(results.regex.result)}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {tool.id === "json-format" && (
                    <>
                      <Textarea placeholder='{"key": "value"}' value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} className="font-mono text-xs min-h-[80px]" />
                      <Button size="sm" onClick={runJsonFormat} disabled={loading === "json-format" || !jsonInput} className="w-full">
                        {loading === "json-format" ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                        Format JSON
                      </Button>
                      {results["json-format"] && (
                        <div className="rounded-lg border border-zinc-800 bg-black/30 p-3 relative">
                          {results["json-format"].error ? (
                            <p className="text-xs text-red-400">{results["json-format"].error}</p>
                          ) : (
                            <>
                              <pre className="text-xs text-zinc-200 font-mono whitespace-pre-wrap">{results["json-format"].result}</pre>
                              <Button variant="ghost" size="sm" className="absolute top-1 right-1 h-6 w-6" onClick={() => copyToClipboard(results["json-format"]?.result || "", "json-format")}>
                                {copied === "json-format" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-zinc-500" />}
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {tool.id === "yaml-format" && (
                    <>
                      <Textarea placeholder="key: value" value={yamlInput} onChange={(e) => setYamlInput(e.target.value)} className="font-mono text-xs min-h-[80px]" />
                      <Button size="sm" onClick={runYamlFormat} disabled={loading === "yaml-format" || !yamlInput} className="w-full">
                        {loading === "yaml-format" ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                        Format YAML
                      </Button>
                      {results["yaml-format"] && (
                        <div className="rounded-lg border border-zinc-800 bg-black/30 p-3 relative">
                          {results["yaml-format"].error ? (
                            <p className="text-xs text-red-400">{results["yaml-format"].error}</p>
                          ) : (
                            <>
                              <pre className="text-xs text-zinc-200 font-mono whitespace-pre-wrap">{results["yaml-format"].result}</pre>
                              <Button variant="ghost" size="sm" className="absolute top-1 right-1 h-6 w-6" onClick={() => copyToClipboard(results["yaml-format"]?.result || "", "yaml-format")}>
                                {copied === "yaml-format" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-zinc-500" />}
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {tool.id === "base64" && (
                    <>
                      <Textarea placeholder="Text to encode/decode" value={base64Input} onChange={(e) => setBase64Input(e.target.value)} className="font-mono text-xs min-h-[60px]" />
                      <div className="flex items-center gap-2">
                        <Button variant={base64Mode === "encode" ? "default" : "outline"} size="sm" onClick={() => setBase64Mode("encode")} className="flex-1 text-xs">Encode</Button>
                        <Button variant={base64Mode === "decode" ? "default" : "outline"} size="sm" onClick={() => setBase64Mode("decode")} className="flex-1 text-xs">Decode</Button>
                      </div>
                      <Button size="sm" onClick={runBase64} disabled={loading === "base64" || !base64Input} className="w-full">
                        {loading === "base64" ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                        {base64Mode === "encode" ? "Encode" : "Decode"}
                      </Button>
                      {results.base64 && (
                        <div className="rounded-lg border border-zinc-800 bg-black/30 p-3 relative">
                          {results.base64.error ? (
                            <p className="text-xs text-red-400">{results.base64.error}</p>
                          ) : (
                            <>
                              <pre className="text-xs text-zinc-200 font-mono whitespace-pre-wrap break-all">{results.base64.result}</pre>
                              <Button variant="ghost" size="sm" className="absolute top-1 right-1 h-6 w-6" onClick={() => copyToClipboard(results.base64?.result || "", "base64")}>
                                {copied === "base64" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-zinc-500" />}
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {tool.id === "jwt-decode" && (
                    <>
                      <Input placeholder="eyJhbGciOiJIUzI1NiIs..." value={jwtInput} onChange={(e) => setJwtInput(e.target.value)} className="font-mono text-xs" />
                      <Button size="sm" onClick={runJwtDecode} disabled={loading === "jwt-decode" || !jwtInput} className="w-full">
                        {loading === "jwt-decode" ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                        Decode JWT
                      </Button>
                      {results["jwt-decode"] && (
                        <div className="rounded-lg border border-zinc-800 bg-black/30 p-3 space-y-2">
                          {results["jwt-decode"].error ? (
                            <p className="text-xs text-red-400">{results["jwt-decode"].error}</p>
                          ) : (
                            <>
                              <div>
                                <p className="text-[10px] text-zinc-500 font-medium mb-1">Header</p>
                                <pre className="text-xs text-blue-300 font-mono whitespace-pre-wrap">{results["jwt-decode"].header as string}</pre>
                              </div>
                              <div>
                                <p className="text-[10px] text-zinc-500 font-medium mb-1">Payload</p>
                                <pre className="text-xs text-emerald-300 font-mono whitespace-pre-wrap">{results["jwt-decode"].payload as string}</pre>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {tool.id === "uuid" && (
                    <>
                      <div className="flex items-center gap-2">
                        <Button variant={uuidFormat === "v4" ? "default" : "outline"} size="sm" onClick={() => setUuidFormat("v4")} className="flex-1 text-xs">v4</Button>
                        <Button variant={uuidFormat === "v7" ? "default" : "outline"} size="sm" onClick={() => setUuidFormat("v7")} className="flex-1 text-xs">v7</Button>
                      </div>
                      <Button size="sm" onClick={runUuidGenerate} className="w-full">
                        <RefreshCw className="mr-2 h-3 w-3" />
                        Generate
                      </Button>
                      {uuidGenerated && (
                        <div className="rounded-lg border border-zinc-800 bg-black/30 p-3 relative">
                          <pre className="text-xs text-zinc-200 font-mono break-all">{uuidGenerated}</pre>
                          <Button variant="ghost" size="sm" className="absolute top-1 right-1 h-6 w-6" onClick={() => copyToClipboard(uuidGenerated, "uuid")}>
                            {copied === "uuid" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-zinc-500" />}
                          </Button>
                        </div>
                      )}
                    </>
                  )}

                  {tool.id === "hash" && (
                    <>
                      <Input placeholder="Text to hash" value={hashInput} onChange={(e) => setHashInput(e.target.value)} className="font-mono text-xs" />
                      <div className="flex flex-wrap gap-1">
                        {["md5", "sha1", "sha256", "sha512"].map((algo) => (
                          <Button key={algo} variant={hashAlgorithm === algo ? "default" : "outline"} size="sm" onClick={() => setHashAlgorithm(algo)} className="text-xs">{algo}</Button>
                        ))}
                      </div>
                      <Button size="sm" onClick={runHash} disabled={loading === "hash" || !hashInput} className="w-full">
                        {loading === "hash" ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                        Generate Hash
                      </Button>
                      {results.hash && (
                        <div className="rounded-lg border border-zinc-800 bg-black/30 p-3 relative">
                          {results.hash.error ? (
                            <p className="text-xs text-red-400">{results.hash.error}</p>
                          ) : (
                            <>
                              <pre className="text-xs text-zinc-200 font-mono break-all">{results.hash.result}</pre>
                              <Button variant="ghost" size="sm" className="absolute top-1 right-1 h-6 w-6" onClick={() => copyToClipboard(results.hash?.result || "", "hash")}>
                                {copied === "hash" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-zinc-500" />}
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {tool.id === "cron" && (
                    <>
                      <Input placeholder="*/5 * * * *" value={cronInput} onChange={(e) => setCronInput(e.target.value)} className="font-mono text-xs" />
                      <Button size="sm" onClick={runCronParse} disabled={loading === "cron" || !cronInput} className="w-full">
                        {loading === "cron" ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                        Parse Cron
                      </Button>
                      {results.cron && (
                        <div className="rounded-lg border border-zinc-800 bg-black/30 p-3">
                          {results.cron.error ? (
                            <p className="text-xs text-red-400">{results.cron.error}</p>
                          ) : (
                            <div className="space-y-1">
                              <p className="text-xs text-zinc-300">{results.cron.description as string}</p>
                              {(results.cron.nextExecutions as string[])?.length > 0 && (
                                <div>
                                  <p className="text-[10px] text-zinc-500 mt-2 mb-1">Next executions:</p>
                                  {(results.cron.nextExecutions as string[]).slice(0, 5).map((d: string, i: number) => (
                                    <p key={i} className="text-xs text-zinc-400 font-mono">{d}</p>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {tool.id === "sql-format" && (
                    <>
                      <Textarea placeholder="SELECT * FROM users WHERE id = 1" value={sqlInput} onChange={(e) => setSqlInput(e.target.value)} className="font-mono text-xs min-h-[80px]" />
                      <Button size="sm" onClick={runSqlFormat} disabled={loading === "sql-format" || !sqlInput} className="w-full">
                        {loading === "sql-format" ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                        Format SQL
                      </Button>
                      {results["sql-format"] && (
                        <div className="rounded-lg border border-zinc-800 bg-black/30 p-3 relative">
                          {results["sql-format"].error ? (
                            <p className="text-xs text-red-400">{results["sql-format"].error}</p>
                          ) : (
                            <>
                              <pre className="text-xs text-zinc-200 font-mono whitespace-pre-wrap">{results["sql-format"].result}</pre>
                              <Button variant="ghost" size="sm" className="absolute top-1 right-1 h-6 w-6" onClick={() => copyToClipboard(results["sql-format"]?.result || "", "sql-format")}>
                                {copied === "sql-format" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-zinc-500" />}
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
