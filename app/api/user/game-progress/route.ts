import { proxyGet } from "@/lib/backend-proxy";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization") || "";
  const { searchParams } = new URL(request.url);
  const puzzleDay = searchParams.get("puzzle_day") || "";
  const hardMode = searchParams.get("hard_mode") || "0";
  return proxyGet(`/api/user/game-progress?puzzle_day=${puzzleDay}&hard_mode=${hardMode}`, {
    headers: { Authorization: auth },
  });
}
