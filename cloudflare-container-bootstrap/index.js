import { Container, getContainer } from "@cloudflare/containers";
import { WorkflowEntrypoint } from "cloudflare:workers";
import { env as workerEnv } from "cloudflare:workers";
export { ContainerProxy } from "@cloudflare/containers";

const CONTAINER_ENV_KEYS = [
  "NODE_ENV",
  "PORT",
  "DATABASE_POOL_MAX",
  "DATABASE_URL",
  "REDIS_URL",
  "JWT_SECRET",
  "D1_RUNTIME_ENABLED",
  "D1_BRIDGE_ENABLED",
  "D1_BRIDGE_HOST",
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
  "MARKET_ARCHIVE_PIPELINE_URL",
  "MARKET_ARCHIVE_PIPELINE_TOKEN",
  "MARKET_ARCHIVE_REQUIRED",
  "MARKET_REFERENCE_RETENTION_SECONDS",
  "ALPHA_VANTAGE_API_BASE_URL",
  "ALPHA_VANTAGE_API_KEY",
  "FAWAZ_CURRENCY_API_BASE_URL",
  "FINNHUB_API_BASE_URL",
  "FINNHUB_API_KEY",
  "MASSIVE_API_BASE_URL",
  "MASSIVE_API_KEY",
  "METALPRICE_API_BASE_URL",
  "METALPRICE_API_KEY",
  "METALS_API_BASE_URL",
  "METALS_API_KEY",
  "METALS_API_QUOTE_DIRECTION",
  "OANDA_API_BASE_URL",
  "OANDA_ACCESS_TOKEN",
  "OANDA_ACCOUNT_ID",
  "RZZRO_API_BASE_URL",
  "TICKDB_API_KEY",
  "TICKDB_HTTP_URL",
  "TICKDB_WS_URL",
];

function containerEnv(env) {
  return Object.fromEntries(
    CONTAINER_ENV_KEYS.filter((key) => env[key] !== undefined).map((key) => [
      key,
      String(env[key]),
    ]),
  );
}

/**
 * The Worker is an edge gateway only. NestJS remains the API, market, wallet,
 * ledger, and Socket.IO authority. Container.fetch preserves HTTP polling and
 * WebSocket upgrades; no Worker-generated financial or market payloads are
 * permitted here.
 */
export class NexiApiContainer extends Container {
  defaultPort = 3000;
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
  envVars = containerEnv(workerEnv);
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

function keyFromPath(url, prefix) {
  const key = decodeURIComponent(url.pathname.slice(prefix.length));
  return key && key.length <= 512 && !key.includes("..") ? key : "";
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
          statement.includes(";")
        ) {
          return Response.json(
            { error: "Only one bounded SQL statement is accepted per item" },
            { status: 400 },
          );
        }
        if (!/^(SELECT|INSERT|UPDATE|DELETE|REPLACE)\b/i.test(statement)) {
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
    if (!sql || sql.length > 16_384 || sql.includes(";")) {
      return Response.json(
        { error: "Only one bounded SQL statement is accepted" },
        { status: 400 },
      );
    }
    if (!/^SELECT\b/i.test(sql)) {
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

  "nexi.r2": async (request, env) => {
    const url = new URL(request.url);
    if (request.method !== "GET")
      return new Response("Method Not Allowed", { status: 405 });
    const key = keyFromPath(url, "/market/");
    if (!key) return new Response("Not found", { status: 404 });
    const object = await env.MARKET_ARCHIVE.get(key);
    return object
      ? new Response(object.body, {
          headers: {
            "content-type":
              object.httpMetadata?.contentType || "application/octet-stream",
          },
        })
      : new Response("Not found", { status: 404 });
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
    if (request.method !== "POST")
      return new Response("Method Not Allowed", { status: 405 });
    const body = await boundedJson(request);
    if (
      !body ||
      typeof body.id !== "string" ||
      !/^[A-Za-z0-9._:-]{1,100}$/.test(body.id)
    ) {
      return Response.json(
        { error: "A valid workflow id is required" },
        { status: 400 },
      );
    }
    const url = new URL(request.url);
    const workflows = {
      "/withdrawal": env.WITHDRAWAL_WORKFLOW,
      "/mining": env.MINING_WORKFLOW,
      "/loan": env.LOAN_WORKFLOW,
    };
    const workflow = workflows[url.pathname];
    if (!workflow) return new Response("Not found", { status: 404 });
    const params = body.params === undefined ? {} : body.params;
    if (!params || typeof params !== "object" || Array.isArray(params)) {
      return Response.json(
        { error: "Workflow params must be an object" },
        { status: 400 },
      );
    }
    const instance = await workflow.create({ id: body.id, params });
    return Response.json({ accepted: true, id: instance.id });
  },

  "nexi.pipeline": async (request, env) => {
    if (request.method !== "POST")
      return new Response("Method Not Allowed", { status: 405 });
    const body = await boundedJson(request);
    const url = new URL(request.url);
    const stream =
      url.pathname === "/market-structured"
        ? env.MARKET_STRUCTURED_STREAM
        : url.pathname === "/market-archive"
          ? env.MARKET_ARCHIVE_STREAM
          : null;
    if (!stream || body === null)
      return Response.json(
        { error: "Invalid pipeline request" },
        { status: 400 },
      );
    const records = Array.isArray(body) ? body : [body];
    if (
      records.length < 1 ||
      records.length > 100 ||
      records.some(
        (record) =>
          !record ||
          typeof record !== "object" ||
          (record.validationMarker !== "undefined" &&
            typeof record.validationMarker !== "string"),
      )
    )
      return Response.json(
        { error: "Invalid pipeline records" },
        { status: 400 },
      );
    await stream.send(records);
    return Response.json({ accepted: records.length });
  },
};

class NexiInfrastructureWorkflow extends WorkflowEntrypoint {
  async run(event, step) {
    const started = await step.do("validation-start", async () => ({
      workflow: event.workflowName,
      instanceId: event.instanceId,
      status: "started",
    }));
    const health = await step.do("read-only-health-check", async () => {
      const target = this.env.NEXI_HEALTH_URL;
      if (typeof target !== "string" || !target.startsWith("https://"))
        throw new Error("NEXI_HEALTH_URL is not configured");
      const response = await fetch(target, {
        headers: { "x-nexi-workflow-check": "1" },
      });
      if (!response.ok)
        throw new Error(`NEXI health check failed with ${response.status}`);
      return { status: response.status };
    });
    const completed = await step.do("validation-complete", async () => ({
      status: "completed",
    }));
    return { started, health, completed };
  }
}

export class NexiWithdrawalWorkflow extends NexiInfrastructureWorkflow {}
export class NexiMiningWorkflow extends NexiInfrastructureWorkflow {}
export class NexiLoanWorkflow extends NexiInfrastructureWorkflow {}

export default {
  async queue(batch, env) {
    const signingSecret =
      typeof env.JWT_SECRET === "string" ? env.JWT_SECRET : "";
    if (!signingSecret)
      throw new Error("JWT_SECRET is required for authenticated Queue ingress");
    const container = getContainer(env.NEXI_API_CONTAINER, "nexi-api");

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
    const container = getContainer(env.NEXI_API_CONTAINER, "nexi-api");

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
      const check = await container.fetch(
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

    const stateBefore = await container
      .getState()
      .catch(() => ({ status: "unavailable" }));
    console.log("NEXI_CONTAINER_FORWARD_BEFORE", {
      path: url.pathname,
      state: stateBefore,
    });
    try {
      const response = await container.fetch(request);
      const stateAfter = await container
        .getState()
        .catch(() => ({ status: "unavailable" }));
      console.log("NEXI_CONTAINER_FORWARD_AFTER", {
        path: url.pathname,
        status: response.status,
        state: stateAfter,
      });
      return response;
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
