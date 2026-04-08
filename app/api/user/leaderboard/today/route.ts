import { proxyGet } from "@/lib/backend-proxy";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const puzzleDay = searchParams.get("puzzle_day") || "";
  return proxyGet(
    `/api/user/leaderboard/today?puzzle_day=${encodeURIComponent(puzzleDay)}`,
    { cacheControl: "public, s-maxage=30, stale-while-revalidate=60" },
  );
}
