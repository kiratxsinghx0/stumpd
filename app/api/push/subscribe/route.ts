import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const SUBS_SET_KEY = "push:endpoints";

function subKey(endpoint: string) {
  return `push:sub:${endpoint}`;
}

export async function POST(request: Request) {
  try {
    const subscription = await request.json();
    if (!subscription?.endpoint) {
      return Response.json({ error: "missing endpoint" }, { status: 400 });
    }

    await redis.set(subKey(subscription.endpoint), JSON.stringify(subscription));
    await redis.sadd(SUBS_SET_KEY, subscription.endpoint);

    return Response.json({ ok: true });
  } catch (err) {
    console.error("push/subscribe error:", err);
    return Response.json({ error: "internal error" }, { status: 500 });
  }
}
