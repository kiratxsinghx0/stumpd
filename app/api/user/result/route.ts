import { proxyPost } from "@/lib/backend-proxy";

export async function POST(request: Request) {
  const auth = request.headers.get("authorization") || "";
  return proxyPost("/api/user/result", await request.text(), {
    headers: { Authorization: auth },
  });
}
