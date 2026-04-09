import { proxyGet } from "@/lib/backend-proxy";

export async function GET() {
  return proxyGet("/api/user/leaderboard/weekly", {
    cacheControl: "public, s-maxage=60, stale-while-revalidate=120",
  });
}
