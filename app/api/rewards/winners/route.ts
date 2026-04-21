import { proxyGet } from "@/lib/backend-proxy";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const weekNumber = searchParams.get("week_number") || "";
  const qs = weekNumber ? `?week_number=${encodeURIComponent(weekNumber)}` : "";
  return proxyGet(`/api/rewards/winners${qs}`, {
    cacheControl: "public, s-maxage=300, stale-while-revalidate=600",
  });
}
