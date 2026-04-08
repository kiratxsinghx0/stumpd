const BACKEND =
  process.env.BACKEND_API_URL ||
  "https://fifabackend-production-2dd4.up.railway.app";

const TIMEOUT_MS = 5_000;

type ProxyOptions = {
  headers?: Record<string, string>;
  cacheControl?: string;
};

function timeoutSignal(): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return { signal: controller.signal, clear: () => clearTimeout(id) };
}

function errorResponse() {
  return new Response(
    JSON.stringify({ success: false, message: "Backend unavailable" }),
    { status: 502, headers: { "Content-Type": "application/json" } },
  );
}

function buildHeaders(cacheControl?: string): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (cacheControl) h["Cache-Control"] = cacheControl;
  return h;
}

export async function proxyGet(
  path: string,
  opts?: ProxyOptions,
): Promise<Response> {
  const { signal, clear } = timeoutSignal();
  try {
    const res = await fetch(`${BACKEND}${path}`, {
      cache: "no-store",
      headers: opts?.headers,
      signal,
    });
    clear();
    return new Response(await res.text(), {
      status: res.status,
      headers: buildHeaders(opts?.cacheControl),
    });
  } catch {
    clear();
    return errorResponse();
  }
}

export async function proxyPost(
  path: string,
  body: string,
  opts?: ProxyOptions,
): Promise<Response> {
  const { signal, clear } = timeoutSignal();
  try {
    const res = await fetch(`${BACKEND}${path}`, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...opts?.headers },
      body,
      signal,
    });
    clear();
    return new Response(await res.text(), {
      status: res.status,
      headers: buildHeaders(opts?.cacheControl),
    });
  } catch {
    clear();
    return errorResponse();
  }
}

export { BACKEND, TIMEOUT_MS };
