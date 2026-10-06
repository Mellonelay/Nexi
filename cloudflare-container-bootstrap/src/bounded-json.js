export const MAX_GATEWAY_BODY_BYTES = 256 * 1024;

/** Read only a bounded number of UTF-8 bytes, even without Content-Length. */
export async function boundedJson(request) {
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_GATEWAY_BODY_BYTES || !request.body) return null;

  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  try {
    for await (const chunk of request.body) {
      bytes += chunk.byteLength;
      if (bytes > MAX_GATEWAY_BODY_BYTES) return null;
      text += decoder.decode(chunk, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } catch {
    return null;
  }
}
