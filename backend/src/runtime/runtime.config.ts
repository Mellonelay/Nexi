export interface RuntimeConfig {
  nodeEnv: string;
  port: number;
  d1RuntimeEnabled: boolean;
  d1BridgeEnabled: boolean;
  redisUrl: string;
  jwtSecret: string;
  corsOrigins: string[];
  marketProviderEnabled: boolean;
  marketProviderWsUrl?: string;
  marketProviderHttpUrl?: string;
  marketProviderName: string;
}

const LOCAL_CORS_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000'];

function requiredValue(environment: NodeJS.ProcessEnv, name: string): string {
  const value = environment[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parsePort(rawPort: string | undefined): number {
  if (!rawPort) {
    return 3000;
  }

  const port = Number(rawPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }
  return port;
}

function parseCorsOrigins(rawOrigins: string | undefined, isProduction: boolean): string[] {
  const origins = rawOrigins
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

  if (origins.length > 0) {
    return [...new Set(origins)];
  }

  if (isProduction) {
    throw new Error('Missing required environment variable: CORS_ORIGINS');
  }

  return LOCAL_CORS_ORIGINS;
}

export function resolveRuntimeConfig(environment: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const nodeEnv = environment.NODE_ENV?.trim() || 'development';
  const isProduction = nodeEnv === 'production';
  const d1RuntimeEnabled = requiredValue(environment, 'D1_RUNTIME_ENABLED');
  const d1BridgeEnabled = requiredValue(environment, 'D1_BRIDGE_ENABLED');
  if (d1RuntimeEnabled !== 'true') throw new Error('D1_RUNTIME_ENABLED must be true');
  if (d1BridgeEnabled !== 'true') throw new Error('D1_BRIDGE_ENABLED must be true');

  return {
    nodeEnv,
    port: parsePort(environment.PORT),
    d1RuntimeEnabled: true,
    d1BridgeEnabled: true,
    redisUrl: requiredValue(environment, 'REDIS_URL'),
    jwtSecret: requiredValue(environment, 'JWT_SECRET'),
    corsOrigins: parseCorsOrigins(environment.CORS_ORIGINS, isProduction),
    marketProviderEnabled: environment.MARKET_PROVIDER_ENABLED === 'true',
    marketProviderWsUrl: environment.MARKET_PROVIDER_WS_URL?.trim() || undefined,
    marketProviderHttpUrl: environment.MARKET_PROVIDER_HTTP_URL?.trim() || undefined,
    marketProviderName: environment.MARKET_PROVIDER_NAME?.trim() || 'configured-provider',
  };
}

export function validateRuntimeEnvironment(environment: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const config = resolveRuntimeConfig(environment);

  return {
    ...environment,
    NODE_ENV: config.nodeEnv,
    PORT: String(config.port),
    CORS_ORIGINS: config.corsOrigins.join(','),
  };
}

export function isCorsOriginAllowed(origin: string | undefined, environment: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(origin) && resolveRuntimeConfig(environment).corsOrigins.includes(origin);
}
