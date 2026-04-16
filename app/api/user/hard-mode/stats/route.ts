import { proxyGet } from "@/lib/backend-proxy";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization") || "";
  return proxyGet("/api/user/hard-mode/stats", {
    headers: { Authorization: auth },
  });
}
