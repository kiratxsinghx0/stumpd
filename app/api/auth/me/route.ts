const BACKEND =
  process.env.BACKEND_API_URL ||
  "https://fifabackend-production-2dd4.up.railway.app";

export async function GET(request: Request) {
  try {
    const auth = request.headers.get("authorization") || "";
    const res = await fetch(`${BACKEND}/api/auth/me`, {
      headers: { Authorization: auth },
    });
    const data = await res.text();
    return new Response(data, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify({ success: false, message: "Backend unavailable" }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }
}
