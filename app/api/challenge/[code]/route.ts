import { proxyGet } from "@/lib/backend-proxy";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  return proxyGet(`/api/challenge/${encodeURIComponent(code)}`);
}
