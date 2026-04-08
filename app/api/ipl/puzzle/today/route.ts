import { BACKEND, TIMEOUT_MS } from "@/lib/backend-proxy";

const ENCODE_KEY = "fw26k";

function xorEncode(plain: string, key: string): string {
  let xored = "";
  for (let i = 0; i < plain.length; i++) {
    xored += String.fromCharCode(plain.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(xored);
}

function obfuscateFullName(json: Record<string, unknown>): Record<string, unknown> {
  const data = json.data as Record<string, unknown> | undefined;
  if (data && typeof data.fullName === "string") {
    return { ...json, data: { ...data, fullName: xorEncode(data.fullName, ENCODE_KEY) } };
  }
  return json;
}

export async function GET() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BACKEND}/api/ipl/puzzle/today`, {
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      const body = await res.text();
      return new Response(body, {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    }
    const json = await res.json();
    const sanitized = obfuscateFullName(json);
    return new Response(JSON.stringify(sanitized), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch {
    clearTimeout(timeout);
    return new Response(
      JSON.stringify({ success: false, message: "Backend unavailable" }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }
}
