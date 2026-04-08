const BACKEND =
  process.env.BACKEND_API_URL ||
  "https://fifabackend-production-2dd4.up.railway.app";

export async function POST(request: Request) {
  try {
    const auth = request.headers.get("authorization") || "";
    const body = await request.text();
    const res = await fetch(`${BACKEND}/api/user/result`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: auth,
      },
      body,
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
