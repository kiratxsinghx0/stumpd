import { proxyGet } from "@/lib/backend-proxy";

export async function GET() {
  return proxyGet("/api/ipl/players", {
    cacheControl: "public, s-maxage=300, stale-while-revalidate=600",
  });
}
