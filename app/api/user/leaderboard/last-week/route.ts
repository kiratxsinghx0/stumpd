import { proxyGet } from "@/lib/backend-proxy";

export async function GET() {
  return proxyGet("/api/user/leaderboard/last-week", {
    cacheControl: "public, s-maxage=300, stale-while-revalidate=600",
  });
}
