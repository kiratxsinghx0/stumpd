import { proxyPost } from "@/lib/backend-proxy";

export async function POST(request: Request) {
  return proxyPost("/api/challenge/players/seed", await request.text());
}
