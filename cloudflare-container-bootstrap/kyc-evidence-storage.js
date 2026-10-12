const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;
const KEY_PREFIX = "kyc-evidence/";

export async function handleKycEvidenceStorage(request, env) {
  const bucket = env.KYC_EVIDENCE;
  if (!bucket) return new Response("Private KYC evidence storage is not configured", { status: 503 });

  const url = new URL(request.url);
  const key = url.searchParams.get("key") ?? "";
  if (!key.startsWith(KEY_PREFIX) || key.includes("..") || key.length > 512) {
    return new Response("Invalid private evidence key", { status: 400 });
  }

  if (request.method === "PUT") {
    const contentType = (request.headers.get("content-type") ?? "").split(";", 1)[0].trim().toLowerCase();
    const allowed = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (!allowed.includes(contentType) || contentLength > MAX_EVIDENCE_BYTES) {
      return new Response("Unsupported or oversized private evidence", { status: 413 });
    }
    const body = await request.arrayBuffer();
    if (body.byteLength === 0 || body.byteLength > MAX_EVIDENCE_BYTES) {
      return new Response("Unsupported or oversized private evidence", { status: 413 });
    }
    await bucket.put(key, body, {
      httpMetadata: { contentType },
      customMetadata: { classification: "sensitive-kyc-evidence" },
    });
    return new Response(null, { status: 201, headers: { "cache-control": "private, no-store" } });
  }

  if (request.method === "HEAD") {
    const object = await bucket.head(key);
    return new Response(null, {
      status: object ? 200 : 404,
      headers: { "cache-control": "private, no-store" },
    });
  }

  if (request.method === "GET") {
    const object = await bucket.get(key);
    if (!object) return new Response("Evidence not found", { status: 404 });
    return new Response(object.body, {
      headers: {
        "cache-control": "private, no-store",
        "content-type": object.httpMetadata?.contentType ?? "application/octet-stream",
        "content-disposition": "attachment; filename=\"kyc-evidence\"",
        "x-content-type-options": "nosniff",
      },
    });
  }

  if (request.method === "DELETE") {
    await bucket.delete(key);
    return new Response(null, { status: 204, headers: { "cache-control": "private, no-store" } });
  }

  return new Response("Method not allowed", { status: 405, headers: { allow: "GET, HEAD, PUT, DELETE" } });
}
