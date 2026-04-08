import { proxyGet } from "@/lib/backend-proxy";

export async function GET() {
  return proxyGet("/api/live-stats/today", {
    cacheControl: "public, s-maxage=15, stale-while-revalidate=30",
  });
}
