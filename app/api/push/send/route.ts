import { Redis } from "@upstash/redis";
import webPush from "web-push";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const vapidSubject = process.env.VAPID_EMAIL!.startsWith("mailto:")
  ? process.env.VAPID_EMAIL!
  : `mailto:${process.env.VAPID_EMAIL}`;

webPush.setVapidDetails(
  vapidSubject,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

const SUBS_SET_KEY = "push:endpoints";
const BATCH_SIZE = 50;

function subKey(endpoint: string) {
  return `push:sub:${endpoint}`;
}

function getPayload(type: string | null) {
  if (type === "evening") {
    return {
      title: "Stumpd",
      body: "Haven't played today? There's still time to guess the IPL player!",
      url: "/stumpd",
    };
  }
  return {
    title: "Stumpd",
    body: "Today's puzzle is live! Can you guess the IPL player?",
    url: "/stumpd",
  };
}

async function sendToEndpoint(
  endpoint: string,
  payload: string,
): Promise<"sent" | "failed" | "expired"> {
  const raw = await redis.get<string>(subKey(endpoint));
  if (!raw) {
    await redis.srem(SUBS_SET_KEY, endpoint);
    return "expired";
  }

  try {
    const sub = typeof raw === "string" ? JSON.parse(raw) : raw;
    await webPush.sendNotification(sub, payload);
    return "sent";
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) {
      await redis.del(subKey(endpoint));
      await redis.srem(SUBS_SET_KEY, endpoint);
      return "expired";
    }
    return "failed";
  }
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const payload = JSON.stringify(getPayload(type));

  const endpoints: string[] = await redis.smembers(SUBS_SET_KEY);
  let sent = 0;
  let failed = 0;
  let expired = 0;

  for (let i = 0; i < endpoints.length; i += BATCH_SIZE) {
    const batch = endpoints.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((ep) => sendToEndpoint(ep, payload)),
    );
    for (const r of results) {
      if (r.status === "fulfilled") {
        if (r.value === "sent") sent++;
        else if (r.value === "failed") failed++;
        else expired++;
      } else {
        failed++;
      }
    }
  }

  return Response.json({ sent, failed, expired, total: endpoints.length });
}
