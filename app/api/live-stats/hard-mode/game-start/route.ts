import { proxyPost } from "@/lib/backend-proxy";

export async function POST(request: Request) {
  return proxyPost("/api/live-stats/hard-mode/game-start", await request.text());
}
