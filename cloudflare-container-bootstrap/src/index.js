import { Container, getContainer } from "@cloudflare/containers";
import { WorkflowEntrypoint } from "cloudflare:workers";
import { NonRetryableError } from "cloudflare:workflows";
export { ContainerProxy } from "@cloudflare/containers";

const CONTAINER_ENV_KEYS = [
  "NODE_ENV",
  "PORT",
  "SENTRY_DSN",
  "SENTRY_ENVIRONMENT",
  "SENTRY_RELEASE",
  "REDIS_URL",
  "JWT_SECRET",
  "OBSERVE_APP_KEY",
  "OBSERVE_APP_SECRET",
  "D1_RUNTIME_ENABLED",
  "D1_BRIDGE_ENABLED",
  "D1_BRIDGE_HOST",
  "QUEUE_BRIDGE_HOST",
  "CORS_ORIGINS",
  "WALLET_AUTH_DOMAIN",
  "WALLET_AUTH_URI",
  "WALLET_AUTH_SUPPORTED_CHAIN_IDS",
  "MARKET_PROVIDER_ENABLED",
  "MARKET_PROVIDER_NAME",
  "MARKET_PROVIDER_NAMES",
  "MARKET_PROVIDER_SYMBOLS",
  "MARKET_PROVIDER_WS_URL",
  "MARKET_PROVIDER_HTTP_URL",
  "MARKET_PROVIDER_POLL_INTERVAL_MS",
  "MARKET_QUOTE_STALE_AFTER_MS",
  "NEXI_MARKET_STALE_AFTER_MS",
  "NEXI_CONVERSION_QUOTE_TTL_MS",
  "MARKET_BACKFILL_ON_STARTUP",
  "NEXI_SCHEDULER_ENABLED",
  "NEXI_B7_ENABLED",
  "NEXI_SANDBOX_ACCOUNT_IDS",
  "FAWAZ_CURRENCY_API_BASE_URL",
  "METALPRICE_API_BASE_URL",
  "METALPRICE_API_KEY",
  "METALS_API_BASE_URL",
  "METALS_API_KEY",
  "METALS_API_QUOTE_DIRECTION",
  "OANDA_API_BASE_URL",
  "OANDA_ACCESS_TOKEN",
  "OANDA_ACCOUNT_ID",
  "RZZRO_API_BASE_URL",
];

function containerEnv(env) {
  return Object.fromEntries(
    CONTAINER_ENV_KEYS.filter((key) => env[key] !== undefined).map((key) => [
      key,
      String(env[key]),
    ]),
  );
}

function getNexiContainer(env) {
  return getContainer(env.NEXI_API_CONTAINER, "nexi-api");
}

async function getRunningNexiContainer(env) {
  const container = getNexiContainer(env);
  await container.startAndWaitForPorts({
    ports: [3000],
    cancellationOptions: { portReadyTimeoutMS: 60_000 },
  });
  return container;
}

async function fetchNexiContainer(container, request) {
  const response = await container.fetch(request);
  if (response.status !== 500) return response;

  const body = await response.clone().text().catch(() => "");
  if (!body.includes("The container is not running, consider calling start()")) {
    return response;
  }

  console.warn("NEXI_CONTAINER_COLD_START_RECOVERY", {
    path: new URL(request.url).pathname,
  });
  await container.startAndWaitForPorts({
    ports: [3000],
    cancellationOptions: { portReadyTimeoutMS: 60_000 },
  });
  return container.fetch(request);
}

/**
 * The Worker is an edge gateway only. NestJS remains the API, market, wallet,
 * ledger, and Socket.IO authority. Container.fetch preserves HTTP polling and
 * WebSocket upgrades; no Worker-generated financial or market payloads are
 * permitted here.
 */
export class NexiApiContainer extends Container {
  constructor(ctx, env) {
    super(ctx, env);
    this.envVars = containerEnv(env);
  }
  defaultPort = 3000;
  enableInternet = true;
  requiredPorts = [3000];
  // Continuous NEXI runtime: do not stop the canonical instance on inactivity.
  // Cloudflare has no fixed maximum instance lifetime; platform rollouts and
  // host lifecycle events can still stop it and are handled by normal wake.
  sleepAfter = "168h";
  async onActivityExpired() {
    console.log("NEXI_CONTAINER_ACTIVITY_EXPIRED_KEEPALIVE", {
      instance: "nexi-api",
      policy: "continuous-runtime",
    });
  }
  pingEndpoint = "localhost/ops/live";

  async onStart() {
    const state = await this.getState().catch(() => ({
      status: "unavailable",
    }));
    console.log("NEXI_CONTAINER_ONSTART", { port: this.defaultPort, state });
  }

  async onStop({ exitCode, reason } = {}) {
    const state = await this.getState().catch(() => ({
      status: "unavailable",
    }));
    console.error("NEXI_CONTAINER_ONSTOP", { exitCode, reason, state });
  }

  async onError(error) {
    const state = await this.getState().catch(() => ({
      status: "unavailable",
    }));
    console.error("NEXI_CONTAINER_ONERROR", {
      error: error instanceof Error ? error.message : String(error),
      state,
    });
    throw error;
  }
}

const MAX_GATEWAY_BODY_BYTES = 256 * 1024;

async function boundedJson(request) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_GATEWAY_BODY_BYTES) return null;
  const text = await request.text();
  if (text.length > MAX_GATEWAY_BODY_BYTES) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function validEnvelope(body) {
  return (
    body &&
    typeof body === "object" &&
    !Array.isArray(body) &&
    typeof body.type === "string" &&
    typeof body.version === "number" &&
    typeof body.idempotencyKey === "string" &&
    typeof body.correlationId === "string" &&
    body.payload !== undefined
  );
}

function validQueueEnvelope(body) {
  return (
    validEnvelope(body) &&
    body.type.length <= 160 &&
    Number.isInteger(body.version) &&
    body.version > 0 &&
    body.idempotencyKey.length <= 160 &&
    body.correlationId.length <= 160 &&
    body.payload &&
    typeof body.payload === "object" &&
    !Array.isArray(body.payload)
  );
}

async function queueIngressSignature(
  secret,
  timestamp,
  queue,
  messageId,
  idempotencyKey,
) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(
      `${timestamp}:${queue}:${messageId}:${idempotencyKey}`,
    ),
  );
  return Array.from(new Uint8Array(signature), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function workflowCommandSignature(
  secret,
  timestamp,
  workflow,
  instanceId,
  action,
  entityId,
  idempotencyKey,
) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(
      `${timestamp}:${workflow}:${instanceId}:${action}:${entityId}:${idempotencyKey}`,
    ),
  );
  return Array.from(new Uint8Array(signature), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function workflowEntityId(params, key) {
  const value = params && typeof params[key] === "string" ? params[key] : "";
  if (!/^[A-Za-z0-9._:-]{1,160}$/.test(value)) {
    throw new NonRetryableError(`Workflow parameter ${key} is invalid`);
  }
  return value;
}

async function invokeWorkflowCommand(
  env,
  workflow,
  instanceId,
  action,
  entityId,
  idempotencyKey,
  payload = {},
) {
  const secret = typeof env.JWT_SECRET === "string" ? env.JWT_SECRET : "";
  if (!secret) throw new NonRetryableError("JWT_SECRET is required for Workflow commands");
  const timestamp = Date.now();
  const signature = await workflowCommandSignature(
    secret,
    timestamp,
    workflow,
    instanceId,
    action,
    entityId,
    idempotencyKey,
  );
  const container = await getRunningNexiContainer(env);
  const response = await container.fetch(
    new Request(`https://nexi.internal/_internal/workflows/${workflow}/${action}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-nexi-workflow-signature": signature,
        "x-nexi-workflow-timestamp": String(timestamp),
        "x-nexi-workflow-name": workflow,
        "x-nexi-workflow-instance": instanceId,
      },
      body: JSON.stringify({
        workflow,
        instanceId,
        action,
        entityId,
        idempotencyKey,
        payload,
      }),
    }),
  );
  const body = await response.json().catch(async () => ({
    message: (await response.text().catch(() => "")).slice(0, 512),
  }));
  if (!response.ok) {
    const message = `WORKFLOW_COMMAND_${workflow}_${action}_HTTP_${response.status}`;
    if (response.status >= 400 && response.status < 500 && ![408, 429].includes(response.status)) {
      throw new NonRetryableError(message);
    }
    throw new Error(message);
  }
  return body && typeof body === "object" ? body : {};
}

function workflowEventPayload(value) {
  if (!value || typeof value !== "object") return {};
  return value.payload && typeof value.payload === "object" ? value.payload : value;
}

function workflowTimestamp(value, label) {
  const timestamp =
    typeof value === "number" && Number.isFinite(value)
      ? value
      : typeof value === "string"
        ? Date.parse(value)
        : NaN;
  if (!Number.isFinite(timestamp)) throw new NonRetryableError(`${label} is invalid`);
  return timestamp;
}

function keyFromPath(url, prefix) {
  const key = decodeURIComponent(url.pathname.slice(prefix.length));
  return key && key.length <= 512 && !key.includes("..") ? key : "";
}

function classifyD1Sql(sql) {
  const allowed = ["SELECT", "INSERT", "UPDATE", "DELETE", "REPLACE"];
  const skipTrivia = (start) => {
    let index = start;
    while (index < sql.length) {
      if (/\s/.test(sql[index])) {
        index += 1;
        continue;
      }
      if (sql.startsWith("--", index)) {
        const newline = sql.indexOf("\n", index + 2);
        index = newline === -1 ? sql.length : newline + 1;
        continue;
      }
      if (sql.startsWith("/*", index)) {
        const end = sql.indexOf("*/", index + 2);
        index = end === -1 ? sql.length : end + 2;
        continue;
      }
      break;
    }
    return index;
  };
  const skipQuoted = (start) => {
    const opener = sql[start];
    const closer = opener === "[" ? "]" : opener;
    for (let index = start + 1; index < sql.length; index += 1) {
      if (sql[index] !== closer) continue;
      if (sql[index + 1] === closer) {
        index += 1;
        continue;
      }
      return index + 1;
    }
    return null;
  };
  const readWord = (start) => {
    let index = skipTrivia(start);
    const first = sql.charCodeAt(index);
    if (
      !(
        (first >= 65 && first <= 90) ||
        (first >= 97 && first <= 122) ||
        first === 95
      )
    ) {
      return null;
    }
    index += 1;
    while (index < sql.length) {
      const code = sql.charCodeAt(index);
      if (
        !(
          (code >= 65 && code <= 90) ||
          (code >= 97 && code <= 122) ||
          (code >= 48 && code <= 57) ||
          code === 95 ||
          code === 36
        )
      ) {
        break;
      }
      index += 1;
    }
    return {
      value: sql.slice(skipTrivia(start), index).toUpperCase(),
      next: index,
    };
  };
  const skipIdentifier = (start) => {
    const index = skipTrivia(start);
    const opener = sql[index];
    if (opener === '"' || opener === "`" || opener === "[") {
      return skipQuoted(index);
    }
    return readWord(index)?.next ?? null;
  };
  const findClosingParen = (openIndex) => {
    let depth = 0;
    for (let index = openIndex; index < sql.length; index += 1) {
      const character = sql[index];
      if (
        character === "'" ||
        character === '"' ||
        character === "`" ||
        character === "["
      ) {
        const next = skipQuoted(index);
        if (next === null) return null;
        index = next - 1;
        continue;
      }
      if (sql.startsWith("--", index)) {
        const newline = sql.indexOf("\n", index + 2);
        index = newline === -1 ? sql.length : newline;
        continue;
      }
      if (sql.startsWith("/*", index)) {
        const end = sql.indexOf("*/", index + 2);
        if (end === -1) return null;
        index = end + 1;
        continue;
      }
      if (character === "(") depth += 1;
      if (character === ")" && --depth === 0) return index + 1;
    }
    return null;
  };

  const first = readWord(0);
  if (!first) return null;
  if (first.value !== "WITH") {
    return allowed.includes(first.value) ? first.value : null;
  }

  let index = first.next;
  const recursive = readWord(index);
  if (recursive?.value === "RECURSIVE") index = recursive.next;

  while (true) {
    const cteNameEnd = skipIdentifier(index);
    if (cteNameEnd === null) return null;
    index = cteNameEnd;
    index = skipTrivia(index);
    if (sql[index] === "(") {
      const columnListEnd = findClosingParen(index);
      if (columnListEnd === null) return null;
      index = columnListEnd;
    }

    const as = readWord(index);
    if (!as || as.value !== "AS") return null;
    index = as.next;
    const modifier = readWord(index);
    if (modifier?.value === "NOT") {
      const materialized = readWord(modifier.next);
      if (!materialized || materialized.value !== "MATERIALIZED") return null;
      index = materialized.next;
    } else if (modifier?.value === "MATERIALIZED") {
      index = modifier.next;
    }

    index = skipTrivia(index);
    if (sql[index] !== "(") return null;
    const cteBodyEnd = findClosingParen(index);
    if (cteBodyEnd === null) return null;
    index = skipTrivia(cteBodyEnd);
    if (sql[index] === ",") {
      index += 1;
      continue;
    }
    const main = readWord(index);
    return main && allowed.includes(main.value) ? main.value : null;
  }
}

function hasTopLevelSqlSemicolon(sql) {
  const skipQuoted = (start) => {
    const opener = sql[start];
    const closer = opener === "[" ? "]" : opener;
    for (let index = start + 1; index < sql.length; index += 1) {
      if (sql[index] !== closer) continue;
      if (sql[index + 1] === closer) {
        index += 1;
        continue;
      }
      return index + 1;
    }
    return null;
  };
  for (let index = 0; index < sql.length; index += 1) {
    const character = sql[index];
    if (
      character === "'" ||
      character === '"' ||
      character === "`" ||
      character === "["
    ) {
      const next = skipQuoted(index);
      if (next === null) return false;
      index = next - 1;
      continue;
    }
    if (sql.startsWith("--", index)) {
      const newline = sql.indexOf("\n", index + 2);
      index = newline === -1 ? sql.length : newline;
      continue;
    }
    if (sql.startsWith("/*", index)) {
      const end = sql.indexOf("*/", index + 2);
      if (end === -1) return false;
      index = end + 1;
      continue;
    }
    if (character === ";") return true;
  }
  return false;
}

/**
 * Containers cannot receive D1 bindings directly. Cloudflare's documented
 * outbound Worker hook lets the container call this handler over the private
 * virtual host `http://nexi-core-d1`, while the handler uses the CORE_DB D1
 * binding in the Workers runtime. Keep the bridge intentionally narrow: it
 * supports bounded read queries and named health checks, never public SQL.
 */
NexiApiContainer.outboundByHost = {
  "nexi-core-d1": async (request, env) => {
    const url = new URL(request.url);
    if (url.pathname === "/health" && request.method === "GET") {
      const result = await env.CORE_DB.prepare("SELECT 1 AS ok").first();
      return Response.json({ ok: result?.ok === 1, servedByPrimary: true });
    }

    if (url.pathname === "/batch" && request.method === "POST") {
      const body = await request.json().catch(() => null);
      const statements =
        body && Array.isArray(body.statements) ? body.statements : [];
      if (statements.length < 1 || statements.length > 16) {
        return Response.json(
          { error: "Batch requires between 1 and 16 statements" },
          { status: 400 },
        );
      }
      const prepared = [];
      for (const item of statements) {
        const statement =
          item && typeof item.sql === "string" ? item.sql.trim() : "";
        const params = item && Array.isArray(item.params) ? item.params : [];
        if (
          !statement ||
          statement.length > 16_384 ||
          hasTopLevelSqlSemicolon(statement)
        ) {
          return Response.json(
            { error: "Only one bounded SQL statement is accepted per item" },
            { status: 400 },
          );
        }
        const statementClass = classifyD1Sql(statement);
        if (!statementClass) {
          return Response.json(
            { error: "Batch accepts only data statements" },
            { status: 403 },
          );
        }
        if (
          params.length > 64 ||
          params.some(
            (value) =>
              value !== null &&
              !["string", "number", "boolean"].includes(typeof value),
          )
        ) {
          return Response.json(
            { error: "Unsupported parameter type" },
            { status: 400 },
          );
        }
        prepared.push(env.CORE_DB.prepare(statement).bind(...params));
      }
      const results = await env.CORE_DB.batch(prepared);
      return Response.json({ results });
    }

    if (url.pathname !== "/query" || request.method !== "POST") {
      return new Response("Not found", { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const sql = body && typeof body.sql === "string" ? body.sql.trim() : "";
    const params = body && Array.isArray(body.params) ? body.params : [];
    if (!sql || sql.length > 16_384 || hasTopLevelSqlSemicolon(sql)) {
      return Response.json(
        { error: "Only one bounded SQL statement is accepted" },
        { status: 400 },
      );
    }
    if (classifyD1Sql(sql) !== "SELECT") {
      return Response.json(
        { error: "The bridge query endpoint is read-only" },
        { status: 403 },
      );
    }
    if (
      params.some(
        (value) =>
          value !== null &&
          ["string", "number"].includes(typeof value) === false,
      )
    ) {
      return Response.json(
        { error: "Unsupported parameter type" },
        { status: 400 },
      );
    }

    const result = await env.CORE_DB.prepare(sql)
      .bind(...params)
      .all();
    return Response.json({ results: result.results, meta: result.meta });
  },

  "nexi.kv": async (request, env) => {
    const url = new URL(request.url);
    const key = keyFromPath(url, "/config/");
    if (!key) return new Response("Not found", { status: 404 });
    if (request.method === "GET") {
      const value = await env.NEXI_CONFIG.get(key);
      return value === null
        ? new Response("Not found", { status: 404 })
        : new Response(value);
    }
    if (request.method === "PUT") {
      const body = await boundedJson(request);
      if (
        !body ||
        typeof body.value !== "string" ||
        body.value.length > MAX_GATEWAY_BODY_BYTES
      )
        return Response.json(
          { error: "Invalid config payload" },
          { status: 400 },
        );
      await env.NEXI_CONFIG.put(key, body.value);
      return Response.json({ ok: true });
    }
    if (request.method === "DELETE") {
      await env.NEXI_CONFIG.delete(key);
      return Response.json({ ok: true });
    }
    return new Response("Method Not Allowed", { status: 405 });
  },

  "nexi.queue": async (request, env) => {
    if (request.method !== "POST")
      return new Response("Method Not Allowed", { status: 405 });
    const body = await boundedJson(request);
    if (!validEnvelope(body))
      return Response.json(
        { error: "Invalid queue envelope" },
        { status: 400 },
      );
    const url = new URL(request.url);
    const queues = {
      "/domain-events": env.DOMAIN_EVENTS_QUEUE,
      "/notifications": env.NOTIFICATIONS_QUEUE,
      "/integration-jobs": env.INTEGRATION_JOBS_QUEUE,
    };
    const queue = queues[url.pathname];
    if (!queue) return new Response("Not found", { status: 404 });
    await queue.send(body);
    return Response.json({
      accepted: true,
      idempotencyKey: body.idempotencyKey,
    });
  },

  "nexi.analytics": async (request, env) => {
    if (request.method !== "POST")
      return new Response("Method Not Allowed", { status: 405 });
    const body = await boundedJson(request);
    if (
      !body ||
      typeof body.eventType !== "string" ||
      body.eventType.length > 80
    )
      return Response.json(
        { error: "Invalid analytics event" },
        { status: 400 },
      );
    await env.NEXI_ANALYTICS.writeDataPoint({
      blobs: [
        body.eventType,
        typeof body.route === "string" ? body.route.slice(0, 160) : "",
      ],
      doubles: [
        typeof body.value === "number" && Number.isFinite(body.value)
          ? body.value
          : 1,
      ],
      indexes: [
        typeof body.correlationId === "string"
          ? body.correlationId.slice(0, 64)
          : "",
      ],
    });
    return Response.json({ accepted: true });
  },

  "nexi.workflow": async (request, env) => {
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const workflows = {
      withdrawal: env.WITHDRAWAL_WORKFLOW,
      mining: env.MINING_WORKFLOW,
      loan: env.LOAN_WORKFLOW,
    };
    const workflow = workflows[parts[0]];
    if (!workflow) return new Response("Not found", { status: 404 });

    if (request.method === "POST" && parts.length === 1) {
      const body = await boundedJson(request);
      if (!body || typeof body.id !== "string" || !/^[A-Za-z0-9._:-]{1,100}$/.test(body.id)) {
        return Response.json({ error: "A valid workflow id is required" }, { status: 400 });
      }
      const params = body.params === undefined ? {} : body.params;
      if (!params || typeof params !== "object" || Array.isArray(params)) {
        return Response.json({ error: "Workflow params must be an object" }, { status: 400 });
      }
      const existing = await workflow.get(body.id);
      const existingStatus = await existing.status().catch(() => ({ status: "unknown" }));
      if (existingStatus.status !== "unknown") {
        return Response.json({ accepted: true, id: body.id, replayed: true, status: existingStatus.status });
      }
      const instance = await workflow.create({ id: body.id, params });
      return Response.json({ accepted: true, id: instance.id, replayed: false });
    }

    if (parts.length === 2 && request.method === "GET") {
      if (!/^[A-Za-z0-9._:-]{1,100}$/.test(parts[1])) return Response.json({ error: "Invalid workflow id" }, { status: 400 });
      const instance = await workflow.get(parts[1]);
      return Response.json(await instance.status());
    }

    if (parts.length === 4 && parts[2] === "events" && request.method === "POST") {
      const [, id, , eventType] = parts;
      if (!/^[A-Za-z0-9._:-]{1,100}$/.test(id) || !/^[A-Za-z0-9._:-]{1,80}$/.test(eventType)) {
        return Response.json({ error: "Invalid workflow event target" }, { status: 400 });
      }
      const body = await boundedJson(request);
      if (body === null) return Response.json({ error: "Invalid workflow event payload" }, { status: 400 });
      const payload = body && typeof body === "object" && "payload" in body ? body.payload : body;
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return Response.json({ error: "Workflow event payload must be an object" }, { status: 400 });
      }
      const instance = await workflow.get(id);
      await instance.sendEvent({ type: eventType, payload });
      return Response.json({ accepted: true, id, eventType });
    }

    return new Response("Method Not Allowed", { status: 405 });
  },
};

export class NexiWithdrawalWorkflow extends WorkflowEntrypoint {
  async run(event, step) {
    const withdrawalId = workflowEntityId(event.params, "withdrawalId");
    const prepared = await step.do(
      "withdrawal-prepare",
      { retries: { limit: 5, delay: "5 seconds", backoff: "exponential" } },
      () => invokeWorkflowCommand(
        this.env, "withdrawal", event.instanceId, "prepare", withdrawalId,
        `${event.instanceId}:prepare`,
      ),
    );
    if (prepared.done === true) return prepared;

    const providerEvent = await step.waitForEvent("withdrawal-provider-result", {
      type: "provider-result",
      timeout: "365 days",
    });
    const provider = workflowEventPayload(providerEvent);
    const status = typeof provider.status === "string" ? provider.status.toUpperCase() : "";
    if (!['SETTLED', 'FAILED'].includes(status)) {
      throw new NonRetryableError("Withdrawal provider result status is invalid");
    }
    const action = status === "SETTLED" ? "settle" : "fail";
    return step.do(
      `withdrawal-${action}`,
      { retries: { limit: 5, delay: "5 seconds", backoff: "exponential" } },
      () => invokeWorkflowCommand(
        this.env, "withdrawal", event.instanceId, action, withdrawalId,
        `${event.instanceId}:${action}`, provider,
      ),
    );
  }
}

export class NexiMiningWorkflow extends WorkflowEntrypoint {
  async run(event, step) {
    const subscriptionId = workflowEntityId(event.params, "subscriptionId");
    let state = await step.do(
      "mining-plan",
      { retries: { limit: 5, delay: "5 seconds", backoff: "exponential" } },
      () => invokeWorkflowCommand(
        this.env, "mining", event.instanceId, "plan", subscriptionId,
        `${event.instanceId}:plan`,
      ),
    );
    for (let cycle = 0; cycle < 1000 && state.done !== true; cycle += 1) {
      const nextRunAt = workflowTimestamp(state.nextRunAt, "Mining nextRunAt");
      await step.sleepUntil(`mining-wait-${cycle}`, nextRunAt);
      state = await step.do(
        `mining-accrue-${cycle}`,
        { retries: { limit: 5, delay: "5 seconds", backoff: "exponential" } },
        () => invokeWorkflowCommand(
          this.env, "mining", event.instanceId, "accrue", subscriptionId,
          `${event.instanceId}:accrue:${cycle}`,
        ),
      );
    }
    if (state.done !== true) throw new NonRetryableError("Mining workflow exceeded supported cycle count");
    return state;
  }
}

export class NexiLoanWorkflow extends WorkflowEntrypoint {
  async run(event, step) {
    const loanId = workflowEntityId(event.params, "loanId");
    const decisionEvent = await step.waitForEvent("loan-decision", {
      type: "decision",
      timeout: "365 days",
    });
    const decision = workflowEventPayload(decisionEvent);
    const value = typeof decision.decision === "string" ? decision.decision.toUpperCase() : "";
    if (value === "REJECTED") return { done: true, state: "REJECTED" };
    if (value !== "APPROVED") throw new NonRetryableError("Loan decision is invalid");

    const schedule = await step.do(
      "loan-load-schedule",
      { retries: { limit: 5, delay: "5 seconds", backoff: "exponential" } },
      () => invokeWorkflowCommand(
        this.env, "loan", event.instanceId, "schedule", loanId,
        `${event.instanceId}:schedule`,
      ),
    );
    if (schedule.done === true) return schedule;
    const dueAt = workflowTimestamp(schedule.dueAt, "Loan dueAt");
    await step.sleepUntil("loan-wait-until-due", dueAt);
    return step.do(
      "loan-check-due",
      { retries: { limit: 5, delay: "5 seconds", backoff: "exponential" } },
      () => invokeWorkflowCommand(
        this.env, "loan", event.instanceId, "check-due", loanId,
        `${event.instanceId}:check-due`,
      ),
    );
  }
}

export default {
  async queue(batch, env) {
    const signingSecret =
      typeof env.JWT_SECRET === "string" ? env.JWT_SECRET : "";
    if (!signingSecret)
      throw new Error("JWT_SECRET is required for authenticated Queue ingress");
    const container = await getRunningNexiContainer(env);

    for (const message of batch.messages) {
      if (!validQueueEnvelope(message.body)) {
        console.error("NEXI_QUEUE_INVALID_ENVELOPE", {
          queue: batch.queue,
          messageId: message.id,
          attempts: message.attempts,
        });
        message.retry({ delaySeconds: 30 });
        continue;
      }
      const timestamp = Date.now();
      const signature = await queueIngressSignature(
        signingSecret,
        timestamp,
        batch.queue,
        message.id,
        message.body.idempotencyKey,
      );
      const response = await container.fetch(
        new Request("https://nexi.internal/_internal/events/queue", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-nexi-event-signature": signature,
            "x-nexi-event-timestamp": String(timestamp),
          },
          body: JSON.stringify({
            queue: batch.queue,
            messageId: message.id,
            attempts: message.attempts,
            event: message.body,
          }),
        }),
      );
      if (!response.ok) {
        console.error("NEXI_QUEUE_INGRESS_FAILED", {
          queue: batch.queue,
          messageId: message.id,
          attempts: message.attempts,
          status: response.status,
        });
        message.retry({
          delaySeconds: Math.min(2 ** Math.min(message.attempts, 7), 300),
        });
        continue;
      }
      message.ack();
    }
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // Public request forwarding relies on Container.fetch() to own cold-start
    // lifecycle and port readiness. Explicit startAndWaitForPorts() here can
    // race a rollout-fixed Durable Object instance and leave it inactive.
    const container = getNexiContainer(env);

    if (url.pathname === "/healthz") {
      const response = Response.json({
        ok: true,
        status: "UP",
        service: "nexi-edge",
      });
      ctx?.waitUntil(
        (async () => {
          try {
            const value = await env.NEXI_PLATFORM_VALIDATION?.get();
            console.log("NEXI_SECRET_BINDING_OK", Boolean(value));
          } catch (error) {
            console.error(
              "NEXI_SECRET_BINDING_ERROR",
              error instanceof Error ? error.message : "secret read failed",
            );
          }
        })(),
      );
      ctx?.waitUntil(
        Promise.resolve(
          env.NEXI_ANALYTICS?.writeDataPoint({
            blobs: ["worker_request", url.pathname],
            doubles: [200, 1],
            indexes: ["healthz"],
          }),
        ).catch(() => undefined),
      );
      return response;
    }

    if (
      /^\/auth\/(login|signup|wallet\/challenge|wallet\/verify|refresh)$/.test(
        url.pathname,
      ) &&
      env.NEXI_AUTH_RATE_LIMITER
    ) {
      const clientKey = request.headers.get("cf-connecting-ip") || "unknown";
      try {
        const limited = await env.NEXI_AUTH_RATE_LIMITER.limit({
          key: `${url.pathname}:${clientKey}`,
        });
        if (!limited.success)
          return Response.json(
            { statusCode: 429, message: "Too many authentication attempts" },
            { status: 429 },
          );
      } catch (error) {
        console.error("NEXI_RATE_LIMIT_ERROR", {
          path: url.pathname,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (url.pathname === "/storage/deposit-proof" && request.method === "PUT") {
      const key = url.searchParams.get("key") ?? "";
      const authorization = request.headers.get("authorization");
      const contentType = request.headers.get("content-type") ?? "";
      const contentLength = Number(request.headers.get("content-length") ?? 0);
      if (!authorization || !key)
        return new Response("Unauthorized", { status: 401 });
      if (
        !/^image\/(png|jpeg|webp|gif)$/.test(contentType) ||
        contentLength > 10 * 1024 * 1024
      ) {
        return new Response("Unsupported or oversized deposit proof", {
          status: 413,
        });
      }
      const check = await fetchNexiContainer(
        container,
        new Request(
          new URL("/financial/deposit-proof-upload/authorize", request.url),
          {
            method: "POST",
            headers: { authorization, "content-type": "application/json" },
            body: JSON.stringify({ key }),
          },
        ),
      );
      if (!check.ok)
        return new Response("Deposit proof upload is not authorized", {
          status: check.status,
        });
      await env.DEPOSIT_PROOFS.put(key, request.body, {
        httpMetadata: { contentType },
      });
      return Response.json({ key, status: "UPLOADED" });
    }

    if (
      url.pathname === "/financial/deposit-claims" &&
      request.method === "POST"
    ) {
      const body = await request
        .clone()
        .json()
        .catch(() => null);
      const proofKey =
        body &&
        typeof body === "object" &&
        typeof body.proofObjectKey === "string"
          ? body.proofObjectKey
          : "";
      if (!proofKey || !(await env.DEPOSIT_PROOFS.head(proofKey))) {
        return Response.json(
          { statusCode: 422, message: "Deposit proof object is not available" },
          { status: 422 },
        );
      }
    }

    try {
      return await fetchNexiContainer(container, request);
    } catch (error) {
      const stateAfterError = await container
        .getState()
        .catch(() => ({ status: "unavailable" }));
      console.error("NEXI_CONTAINER_FORWARD_ERROR", {
        path: url.pathname,
        error: error instanceof Error ? error.message : String(error),
        state: stateAfterError,
      });
      throw error;
    }
  },
};
