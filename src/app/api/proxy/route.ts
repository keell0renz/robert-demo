// A dumb little fetch proxy for Path-B apps. The generated React runs in the
// browser, so a direct `fetch` to a third-party API hits CORS for any host that
// doesn't send permissive headers. Routing through this same-origin endpoint
// sidesteps that: the server fetches the URL and streams the body back.
//
// It's a PoC, so the guardrails are deliberately light — just enough to not be a
// trivially abusable open SSRF proxy: http/https only, GET only, block obviously
// internal hosts, cap the response size and time.

export const maxDuration = 20;

const MAX_BYTES = 2_000_000; // 2 MB is plenty for a demo widget
const TIMEOUT_MS = 10_000;

// Block localhost / link-local / private ranges and cloud metadata so the proxy
// can't be pointed at internal services. Not exhaustive — a best-effort fence.
function isBlockedHost(host: string): boolean {
  const h = host.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".internal")) return true;
  if (h === "0.0.0.0" || h === "::1" || h === "[::1]") return true;
  if (h === "169.254.169.254") return true; // cloud metadata
  if (/^127\./.test(h)) return true;
  if (/^10\./.test(h)) return true;
  if (/^192\.168\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  if (/^169\.254\./.test(h)) return true;
  return false;
}

export async function GET(req: Request) {
  const target = new URL(req.url).searchParams.get("url");
  if (!target) {
    return Response.json({ error: "Missing ?url=" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return Response.json({ error: "Invalid url" }, { status: 400 });
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return Response.json({ error: "Only http/https are allowed" }, { status: 400 });
  }
  if (isBlockedHost(parsed.hostname)) {
    return Response.json({ error: "That host is not allowed" }, { status: 403 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const upstream = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: { "user-agent": "robert-demo-proxy/1.0", accept: "*/*" },
      redirect: "follow",
    });

    const buf = await upstream.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) {
      return Response.json({ error: "Response too large" }, { status: 502 });
    }

    const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
    return new Response(buf, {
      status: upstream.status,
      headers: {
        "content-type": contentType,
        "cache-control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error && err.name === "AbortError" ? "Upstream timed out" : "Upstream fetch failed";
    return Response.json({ error: message }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
