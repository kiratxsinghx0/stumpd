import { getStoredToken } from "./auth-api";

/** Row from `user_normal_badges` / `user_hard_badges` (snake_case from API). */
export type UserBadgeRow = {
  user_id: number;
  streak_7_earned_at: string | null;
  streak_15_earned_at: string | null;
  streak_30_earned_at: string | null;
  streak_50_earned_at: string | null;
  streak_100_earned_at: string | null;
  stumpd_in_one_count: number;
  stumpd_in_one_last_at: string | null;
  stumpd_in_two_count: number;
  stumpd_in_two_last_at: string | null;
  updated_at?: string | null;
};

export type MyBadgesPayload = {
  normal: UserBadgeRow | null;
  hard: UserBadgeRow | null;
};

export async function fetchMyBadges(): Promise<MyBadgesPayload | null> {
  const token = getStoredToken();
  if (!token) return null;
  try {
    const res = await fetch("/api/user/badges", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { success?: boolean; data?: MyBadgesPayload };
    if (!json.success || !json.data) return null;
    return json.data;
  } catch {
    return null;
  }
}
