"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  Database,
  Table2,
  ArrowRightLeft,
  History,
  Play,
  AlertCircle,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Columns3,
  Key,
  Lock,
  Unlock,
  Terminal,
} from "lucide-react";

interface DatabaseHealth {
  status: "connected" | "disconnected" | "error";
  totalTables: number;
  migrationCount: number;
  lastMigrationDate: string | null;
  databaseName: string;
  host: string;
  port: number;
}

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
  isPrimary: boolean;
}

interface TableInfo {
  name: string;
  columns: ColumnInfo[];
}

interface Migration {
  id: string;
  name: string;
  createdAt: string;
  status: "applied" | "pending" | "failed";
}

interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  executionTime: number;
}

const mockTables: TableInfo[] = [
  {
    name: "users",
    columns: [
      { name: "id", type: "UUID", nullable: false, defaultValue: "gen_random_uuid()", isPrimary: true },
      { name: "email", type: "VARCHAR(255)", nullable: false, defaultValue: null, isPrimary: false },
      { name: "name", type: "VARCHAR(255)", nullable: true, defaultValue: null, isPrimary: false },
      { name: "created_at", type: "TIMESTAMPTZ", nullable: false, defaultValue: "NOW()", isPrimary: false },
    ],
  },
  {
    name: "projects",
    columns: [
      { name: "id", type: "UUID", nullable: false, defaultValue: "gen_random_uuid()", isPrimary: true },
      { name: "name", type: "VARCHAR(255)", nullable: false, defaultValue: null, isPrimary: false },
      { name: "user_id", type: "UUID", nullable: false, defaultValue: null, isPrimary: false },
      { name: "created_at", type: "TIMESTAMPTZ", nullable: false, defaultValue: "NOW()", isPrimary: false },
    ],
  },
  {
    name: "deployments",
    columns: [
      { name: "id", type: "UUID", nullable: false, defaultValue: "gen_random_uuid()", isPrimary: true },
      { name: "project_id", type: "UUID", nullable: false, defaultValue: null, isPrimary: false },
      { name: "status", type: "VARCHAR(50)", nullable: false, defaultValue: "'pending'", isPrimary: false },
      { name: "created_at", type: "TIMESTAMPTZ", nullable: false, defaultValue: "NOW()", isPrimary: false },
    ],
  },
];

const mockMigrations: Migration[] = [
  { id: "1", name: "001_create_users", createdAt: new Date(Date.now() - 86400000 * 30).toISOString(), status: "applied" },
  { id: "2", name: "002_create_projects", createdAt: new Date(Date.now() - 86400000 * 25).toISOString(), status: "applied" },
  { id: "3", name: "003_add_deployments", createdAt: new Date(Date.now() - 86400000 * 20).toISOString(), status: "applied" },
  { id: "4", name: "004_add_indexes", createdAt: new Date(Date.now() - 86400000 * 10).toISOString(), status: "applied" },
  { id: "5", name: "005_add_team_invites", createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), status: "pending" },
];

export function DatabaseDashboardClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<DatabaseHealth | null>(null);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [activeTab, setActiveTab] = useState("tables");
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const [queryInput, setQueryInput] = useState("");
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [healthRes, tablesRes] = await Promise.all([
        fetch("/api/database"),
        fetch("/api/database/tables"),
      ]);
      if (!healthRes.ok) {
        const err = await healthRes.json();
        throw new Error(err.error || "Failed to fetch database data");
      }
      const healthData: DatabaseHealth = await healthRes.json();
      setHealth(healthData);
      if (tablesRes.ok) {
        const tablesData: TableInfo[] = await tablesRes.json();
        setTables(tablesData);
        if (tablesData.length > 0 && !selectedTable) {
          setSelectedTable(tablesData[0].name);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch database data");
    } finally {
      setLoading(false);
    }
  }, [selectedTable]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const runQuery = async () => {
    if (!queryInput.trim()) return;
    const trimmed = queryInput.trim().toUpperCase();
    if (!trimmed.startsWith("SELECT")) {
      setQueryError("Only SELECT queries are allowed");
      setQueryResult(null);
      return;
    }
    setQueryLoading(true);
    setQueryError(null);
    setQueryResult(null);
    try {
      const res = await fetch("/api/database/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryInput.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Query failed");
      }
      const data: QueryResult = await res.json();
      setQueryResult(data);
    } catch (e) {
      setQueryError(e instanceof Error ? e.message : "Query failed");
    } finally {
      setQueryLoading(false);
    }
  };

  const currentTable = tables.find((t) => t.name === selectedTable);

  const selectedColumns = currentTable?.columns || [];
  const relationships = [
    { from: "projects.user_id", to: "users.id", type: "Many-to-One" },
    { from: "deployments.project_id", to: "projects.id", type: "Many-to-One" },
  ];

  if (error && !loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Database Not Available</h2>
          <p className="text-zinc-400 text-center max-w-md">{error}</p>
          <Button onClick={fetchData} className="mt-6">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Database</h1>
            <p className="text-zinc-400">Manage database tables, migrations, and run queries</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <Card>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm text-zinc-400">Database Health</p>
                  <Badge
                    variant={health?.status === "connected" ? "success" : health?.status === "disconnected" ? "warning" : "destructive"}
                    className="mt-1 capitalize"
                  >
                    {health?.status || "unknown"}
                  </Badge>
                  {health && (
                    <p className="text-xs text-zinc-500 mt-1">{health.databaseName}</p>
                  )}
                </div>
                <div className="rounded-lg bg-emerald-600/10 p-3">
                  <Database className="h-5 w-5 text-emerald-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm text-zinc-400">Total Tables</p>
                  <p className="text-2xl font-bold text-white">{health?.totalTables ?? 0}</p>
                </div>
                <div className="rounded-lg bg-blue-600/10 p-3">
                  <Table2 className="h-5 w-5 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm text-zinc-400">Migrations</p>
                  <p className="text-2xl font-bold text-white">{health?.migrationCount ?? 0}</p>
                </div>
                <div className="rounded-lg bg-purple-600/10 p-3">
                  <History className="h-5 w-5 text-purple-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm text-zinc-400">Last Migration</p>
                  <p className="text-sm font-medium text-white">
                    {health?.lastMigrationDate
                      ? formatDistanceToNow(new Date(health.lastMigrationDate), { addSuffix: true })
                      : "N/A"}
                  </p>
                </div>
                <div className="rounded-lg bg-amber-600/10 p-3">
                  <CheckCircle2 className="h-5 w-5 text-amber-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Database Explorer</CardTitle>
            <CardDescription>Browse tables, relationships, migrations, and run queries</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="tables">
                  <Table2 className="mr-2 h-4 w-4" />
                  Tables
                </TabsTrigger>
                <TabsTrigger value="relationships">
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  Relationships
                </TabsTrigger>
                <TabsTrigger value="migrations">
                  <History className="mr-2 h-4 w-4" />
                  Migrations
                </TabsTrigger>
                <TabsTrigger value="query">
                  <Terminal className="mr-2 h-4 w-4" />
                  Query Runner
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tables">
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : tables.length === 0 ? (
                  <div className="py-8 text-center text-zinc-500">No tables found</div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-1 space-y-1">
                      <p className="text-sm font-medium text-zinc-400 mb-2">Tables</p>
                      {tables.map((t) => (
                        <button
                          key={t.name}
                          onClick={() => setSelectedTable(t.name)}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedTable === t.name
                              ? "bg-blue-600/20 text-blue-400 border border-blue-600/30"
                              : "text-zinc-300 hover:bg-zinc-800/50 border border-transparent"
                          }`}
                        >
                          <Table2 className="h-4 w-4 shrink-0" />
                          <span className="font-mono">{t.name}</span>
                          <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0">
                            {t.columns.length}
                          </Badge>
                        </button>
                      ))}
                    </div>
                    <div className="lg:col-span-2">
                      {currentTable ? (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <p className="text-sm font-medium text-zinc-400">Columns</p>
                            <Badge variant="outline" className="text-xs">{currentTable.columns.length} columns</Badge>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-zinc-800 text-left text-zinc-400">
                                  <th className="pb-3 pr-4 font-medium">Name</th>
                                  <th className="pb-3 pr-4 font-medium">Type</th>
                                  <th className="pb-3 pr-4 font-medium">Nullable</th>
                                  <th className="pb-3 pr-4 font-medium">Default</th>
                                  <th className="pb-3 font-medium">Primary</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedColumns.map((col) => (
                                  <tr key={col.name} className="border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/30">
                                    <td className="py-3 pr-4">
                                      <div className="flex items-center gap-2">
                                        <Columns3 className="h-4 w-4 text-zinc-500" />
                                        <span className="text-white font-mono font-medium">{col.name}</span>
                                      </div>
                                    </td>
                                    <td className="py-3 pr-4">
                                      <Badge variant="outline" className="font-mono text-xs">{col.type}</Badge>
                                    </td>
                                    <td className="py-3 pr-4">
                                      {col.nullable ? (
                                        <Unlock className="h-4 w-4 text-amber-400" />
                                      ) : (
                                        <Lock className="h-4 w-4 text-emerald-400" />
                                      )}
                                    </td>
                                    <td className="py-3 pr-4 text-zinc-400 text-xs font-mono">
                                      {col.defaultValue || <span className="text-zinc-600">—</span>}
                                    </td>
                                    <td className="py-3">
                                      {col.isPrimary ? (
                                        <Key className="h-4 w-4 text-yellow-400" />
                                      ) : (
                                        <span className="text-zinc-600">—</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div className="mt-6">
                            <p className="text-sm font-medium text-zinc-400 mb-3">Schema Preview</p>
                            <div className="rounded-lg border border-zinc-800 bg-black/30 p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Table2 className="h-4 w-4 text-blue-400" />
                                <span className="text-sm font-mono font-medium text-white">{currentTable.name}</span>
                              </div>
                              <div className="space-y-1">
                                {currentTable.columns.map((col, idx) => (
                                  <div key={col.name} className="flex items-center gap-2 text-xs font-mono">
                                    <span className="w-4 text-zinc-600">{idx === 0 ? "┌" : idx === currentTable.columns.length - 1 ? "└" : "│"}</span>
                                    {col.isPrimary ? (
                                      <Key className="h-3 w-3 text-yellow-400" />
                                    ) : (
                                      <span className="w-3" />
                                    )}
                                    <span className="text-zinc-200">{col.name}</span>
                                    <span className="text-zinc-500">{col.type}</span>
                                    {col.nullable && <span className="text-amber-500">?</span>}
                                    {col.defaultValue && (
                                      <span className="text-zinc-600">= {col.defaultValue}</span>
                                    )}
                                    {idx === currentTable.columns.length - 1 ? "└" : idx === 0 ? "┐" : "│"}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="py-8 text-center text-zinc-500">Select a table to view columns</div>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="relationships">
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {relationships.length === 0 ? (
                      <div className="py-8 text-center text-zinc-500">No relationships defined</div>
                    ) : (
                      relationships.map((rel, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-4 rounded-lg border border-zinc-800 px-4 py-3"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-mono text-white">{rel.from}</span>
                          </div>
                          <ArrowRightLeft className="h-4 w-4 text-blue-400 shrink-0" />
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-mono text-white">{rel.to}</span>
                          </div>
                          <Badge variant="outline" className="ml-auto shrink-0 text-xs">
                            {rel.type}
                          </Badge>
                        </div>
                      ))
                    )}
                    <div className="mt-4 rounded-lg border border-zinc-800 bg-black/30 p-4">
                      <p className="text-sm font-medium text-zinc-400 mb-3">Relationship Diagram</p>
                      <pre className="text-xs text-zinc-300 font-mono leading-relaxed">
{`users (1) ──< (N) projects (1) ──< (N) deployments
  │                        │
  └── projects.user_id     └── deployments.project_id
      references users.id      references projects.id`}
                      </pre>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="migrations">
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-800 text-left text-zinc-400">
                          <th className="pb-3 pr-4 font-medium">Name</th>
                          <th className="pb-3 pr-4 font-medium">Created</th>
                          <th className="pb-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockMigrations.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="py-8 text-center text-zinc-500">No migrations found</td>
                          </tr>
                        ) : (
                          mockMigrations.map((m) => (
                            <tr key={m.id} className="border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/30">
                              <td className="py-3 pr-4">
                                <span className="text-white font-mono">{m.name}</span>
                              </td>
                              <td className="py-3 pr-4 text-zinc-400 text-xs">
                                {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                              </td>
                              <td className="py-3">
                                <Badge
                                  variant={m.status === "applied" ? "success" : m.status === "failed" ? "destructive" : "secondary"}
                                  className="capitalize"
                                >
                                  {m.status === "applied" ? (
                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                  ) : m.status === "failed" ? (
                                    <XCircle className="mr-1 h-3 w-3" />
                                  ) : null}
                                  {m.status}
                                </Badge>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="query">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-zinc-400">SQL Query</label>
                      <p className="text-xs text-zinc-500">Only SELECT queries are allowed</p>
                    </div>
                    <Textarea
                      placeholder="SELECT * FROM users LIMIT 10;"
                      value={queryInput}
                      onChange={(e) => { setQueryInput(e.target.value); setQueryError(null); }}
                      className="font-mono text-sm min-h-[120px]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={runQuery} disabled={queryLoading || !queryInput.trim()}>
                      {queryLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="mr-2 h-4 w-4" />
                      )}
                      Run
                    </Button>
                    {queryResult && (
                      <span className="text-xs text-zinc-500">
                        {queryResult.rowCount} row{queryResult.rowCount !== 1 ? "s" : ""} returned in {queryResult.executionTime}ms
                      </span>
                    )}
                  </div>

                  {queryError && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-800 bg-red-900/20 px-4 py-3">
                      <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                      <p className="text-sm text-red-300">{queryError}</p>
                    </div>
                  )}

                  {queryLoading && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                    </div>
                  )}

                  {queryResult && !queryLoading && (
                    <div className="overflow-x-auto rounded-lg border border-zinc-800">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-zinc-800 bg-zinc-900/50 text-left text-zinc-400">
                            {queryResult.columns.map((col) => (
                              <th key={col} className="px-4 py-3 font-medium font-mono text-xs">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {queryResult.rows.length === 0 ? (
                            <tr>
                              <td colSpan={queryResult.columns.length} className="px-4 py-8 text-center text-zinc-500">
                                Query returned no rows
                              </td>
                            </tr>
                          ) : (
                            queryResult.rows.map((row, i) => (
                              <tr key={i} className="border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/30">
                                {queryResult.columns.map((col) => (
                                  <td key={col} className="px-4 py-3 text-zinc-200 font-mono text-xs">
                                    {String(row[col] ?? <span className="text-zinc-600">NULL</span>)}
                                  </td>
                                ))}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
}
