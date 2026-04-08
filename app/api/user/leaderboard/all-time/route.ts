import { proxyGet } from "@/lib/backend-proxy";

export async function GET() {
  return proxyGet("/api/user/leaderboard/all-time", {
    cacheControl: "public, s-maxage=120, stale-while-revalidate=300",
  });
}
