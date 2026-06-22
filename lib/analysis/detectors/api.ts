import { DetectedApi } from "../types";

const API_PATTERNS: Record<string, { regex: RegExp; type: DetectedApi["type"]; method: string }[]> = {
  "rest": [
    { regex: /router\.(get|post|put|delete|patch)\(['"](.+?)['"]/g, type: "rest", method: "" },
    { regex: /app\.(get|post|put|delete|patch)\(['"](.+?)['"]/g, type: "rest", method: "" },
    { regex: /@app\.(get|post|put|delete)\(['"](.+?)['"]/g, type: "rest", method: "" },
    { regex: /@(Get|Post|Put|Delete|Patch)\(['"](.+?)['"]/g, type: "rest", method: "" },
    { regex: /\.route\(['"](.+?)['"]\)\.[(get|post|put|delete)]/g, type: "rest", method: "" },
    { regex: /@RequestMapping\(.*method\s*=\s*(RequestMethod\.)?(\w+)/g, type: "rest", method: "" },
    { regex: /Route::(get|post|put|delete|patch)\(['"](.+?)['"]/g, type: "rest", method: "" },
  ],
  "graphql": [
    { regex: /graphql/gi, type: "graphql", method: "POST" },
    { regex: /GraphQLModule/g, type: "graphql", method: "POST" },
    { regex: /ApolloServer/g, type: "graphql", method: "POST" },
    { regex: /graphql-yoga/g, type: "graphql", method: "POST" },
    { regex: /@Resolver\(/g, type: "graphql", method: "POST" },
    { regex: /typeDefs/g, type: "graphql", method: "POST" },
    { regex: /buildSchema/g, type: "graphql", method: "POST" },
  ],
  "websocket": [
    { regex: /WebSocket|socket\.io|ws:\/\//gi, type: "websocket", method: "WS" },
    { regex: /io\.on\(['"]connection['"]/gi, type: "websocket", method: "WS" },
    { regex: /new WebSocket/gi, type: "websocket", method: "WS" },
    { regex: /@WebSocketGateway/g, type: "websocket", method: "WS" },
  ],
  "grpc": [
    { regex: /grpc/gi, type: "grpc", method: "RPC" },
    { regex: /protobuf/gi, type: "grpc", method: "RPC" },
    { regex: /@GrpcMethod/g, type: "grpc", method: "RPC" },
    { regex: /proto\(/g, type: "grpc", method: "RPC" },
    { regex: /\.proto['"]/g, type: "grpc", method: "RPC" },
  ],
};

export function detectApis(
  filePath: string,
  content: string,
  serviceName: string
): DetectedApi[] {
  const apis: DetectedApi[] = [];
  const fileName = filePath.split("/").pop() || "";
  const isSource = /\.(ts|js|py|rb|java|kt|go|rs|graphql|gql)$/.test(filePath);

  if (!isSource && !["routes.ts", "routes.js", "api.ts", "api.js", "router.ts", "router.js", "urls.py", "urls.ts", "urls.js"].includes(fileName)) return apis;

  for (const [, patterns] of Object.entries(API_PATTERNS)) {
    for (const { regex, type } of patterns) {
      const matches = content.matchAll(regex);
      for (const match of matches) {
        const method = match[1]?.toUpperCase() || "GET";
        const path = match[2] || match[1] || "/";
        apis.push({
          method,
          path,
          serviceName,
          auth: content.includes("authenticate") || content.includes("auth") || content.includes("middleware") || content.includes("@UseGuards"),
          type,
          sourceFile: filePath,
        });
      }
    }
  }

  return apis;
}
