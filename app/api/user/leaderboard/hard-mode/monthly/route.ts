import { proxyGet } from "@/lib/backend-proxy";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const puzzleDay = searchParams.get("puzzle_day") || "";
  const qs = puzzleDay ? `?puzzle_day=${encodeURIComponent(puzzleDay)}` : "";
  return proxyGet(`/api/user/leaderboard/hard-mode/monthly${qs}`, {
    cacheControl: "public, s-maxage=60, stale-while-revalidate=120",
  });
}
