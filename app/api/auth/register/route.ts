import { proxyPost } from "@/lib/backend-proxy";

export async function POST(request: Request) {
  return proxyPost("/api/auth/register", await request.text());
}
