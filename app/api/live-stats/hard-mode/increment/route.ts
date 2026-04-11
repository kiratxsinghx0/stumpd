import { proxyPost } from "@/lib/backend-proxy";

export async function POST(request: Request) {
  return proxyPost("/api/live-stats/hard-mode/increment", await request.text());
}
