import { DetectedDatabase, DetectedService } from "../types";

const DB_PATTERNS: Record<string, RegExp[]> = {
  postgresql: [
    /postgres/i,
    /pg\b/,
    /@postgres/i,
    /postgresql:\/\//,
    /pg:\/\//,
    /"pg":/,
    /'pg'/,
    /psycopg2/,
    /asyncpg/,
    /pg-promise/,
    /PrismaClient/,
    /drizzle/,
    /postgres\.js/,
  ],
  mysql: [
    /mysql/i,
    /mysql:\/\//,
    /"mysql":/,
    /'mysql'/,
    /mysql2/,
    /mysqli/,
    /@mysql/i,
  ],
  mongodb: [
    /mongodb/i,
    /mongodb:\/\//,
    /"mongoose":/,
    /'mongoose'/,
    /"mongodb":/,
    /'mongodb'/,
    /MongoClient/,
    /@mongodb/i,
  ],
  redis: [
    /redis/i,
    /redis:\/\//,
    /"redis":/,
    /'redis'/,
    /ioredis/,
    /RedisClient/,
    /@redis/i,
  ],
  sqlite: [
    /sqlite/i,
    /sqlite:\/\//,
    /"sqlite3":/,
    /'sqlite3'/,
    /better-sqlite3/,
    /\.sqlite/,
  ],
  elasticsearch: [
    /elasticsearch/i,
    /@elastic/i,
    /"elasticsearch":/,
    /'elasticsearch'/,
    /elasticsearch-js/,
  ],
};

const DB_CONNECTION_PATTERNS = [
  /postgresql:\/\/(\S+?):(\S+?)@(\S+?):(\d+)\/(\S+)/,
  /mysql:\/\/(\S+?):(\S+?)@(\S+?):(\d+)\/(\S+)/,
  /mongodb:\/\/(\S+?):(\S+?)@(\S+?):(\d+)\/(\S+)/,
  /redis:\/\/(\S+?)@(\S+?):(\d+)/,
  /host:\s*['"](.+?)['"][\s\S]*?port:\s*(\d+)/,
  /port:\s*(\d+)[\s\S]*?host:\s*['"](.+?)['"]/,
  /database:\s*['"](.+?)['"]/,
  /dbname=\s*(\w+)/,
];

export function detectDatabases(
  filePath: string,
  content: string,
  services: DetectedService[]
): DetectedDatabase[] {
  const detected: DetectedDatabase[] = [];
  const fileName = filePath.split("/").pop() || "";
  const isConfig = ["package.json", "requirements.txt", "Gemfile", "Cargo.toml", "docker-compose.yml", "docker-compose.yaml", "schema.prisma"].includes(fileName);
  const isSource = /\.(ts|js|py|rb|java|kt|go|rs)$/.test(filePath);

  if (!isConfig && !isSource) return detected;

  const serviceName = findServiceForFile(filePath, services);

  const detectedTypes = new Set<string>();

  for (const [dbType, patterns] of Object.entries(DB_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(content)) {
        detectedTypes.add(dbType);
        break;
      }
    }
  }

  for (const dbType of detectedTypes) {
    let host: string | undefined;
    let port: number | undefined;
    let name: string | undefined;

    for (const pattern of DB_CONNECTION_PATTERNS) {
      const match = content.match(pattern);
      if (match) {
        if (match[3] && match[4]) {
          host = match[3];
          port = parseInt(match[4], 10);
          name = match[5];
        } else if (match[1] && match[2]) {
          host = match[2];
          port = parseInt(match[1], 10);
          name = match[3];
        } else if (match[1]) {
          name = match[1];
        }
        break;
      }
    }

    if (!port) {
      const portMap: Record<string, number> = {
        postgresql: 5432,
        mysql: 3306,
        mongodb: 27017,
        redis: 6379,
        sqlite: 0,
        elasticsearch: 9200,
      };
      port = portMap[dbType];
    }

    detected.push({
      type: dbType,
      name: name || dbType,
      host,
      port,
      sourceFile: filePath,
      serviceName,
    });

    if (serviceName) {
      const service = services.find((s) => s.name === serviceName);
      if (service && !service.databases.includes(dbType)) {
        service.databases.push(dbType);
      }
    }
  }

  return detected;
}

function findServiceForFile(filePath: string, services: DetectedService[]): string {
  for (const service of services) {
    if (filePath.includes(service.sourcePath.split("/").slice(0, -1).join("/"))) {
      return service.name;
    }
  }
  return "unknown";
}
