const BACKEND =
  process.env.BACKEND_API_URL ||
  "https://fifabackend-production-2dd4.up.railway.app";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ day: string }> },
) {
  const { day } = await params;
  const res = await fetch(`${BACKEND}/api/ipl/puzzle/day/${day}`, {
    cache: "no-store",
  });
  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
