import { proxyGet } from "@/lib/backend-proxy";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization") || "";
  const { searchParams } = new URL(request.url);
  const weekNumber = searchParams.get("week_number") || "";
  const qs = weekNumber ? `?week_number=${encodeURIComponent(weekNumber)}` : "";
  return proxyGet(`/api/rewards/status${qs}`, {
    headers: { Authorization: auth },
  });
}
