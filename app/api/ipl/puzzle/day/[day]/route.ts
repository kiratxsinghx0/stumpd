const BACKEND =
  process.env.BACKEND_API_URL ||
  "https://fifabackend-production-2dd4.up.railway.app";

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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ day: string }> },
) {
  const { day } = await params;
  const res = await fetch(`${BACKEND}/api/ipl/puzzle/day/${day}`, {
    cache: "no-store",
  });
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
    headers: { "Content-Type": "application/json" },
  });
}
