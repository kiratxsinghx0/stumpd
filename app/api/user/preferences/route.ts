import { proxyGet, proxyPost } from "@/lib/backend-proxy";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization") || "";
  return proxyGet("/api/user/preferences", {
    headers: { Authorization: auth },
  });
}

export async function POST(request: Request) {
  const auth = request.headers.get("authorization") || "";
  return proxyPost("/api/user/preferences", await request.text(), {
    headers: { Authorization: auth },
  });
}
