import type { UserBadgeRow } from "../services/badges-api";

export type BadgeDef = {
  id: string;
  title: string;
  hint: string;
  earned: boolean;
  detail?: string;
};

/** Streak badge tiers in ascending order (must match DB columns `streak_*_earned_at`). */
export const STREAK_MILESTONE_DAYS = [7, 15, 30, 50, 100] as const;

/** Smallest streak milestone not yet earned; `null` if every streak badge is earned. */
export function getNextStreakMilestoneDays(row: UserBadgeRow | null): number | null {
  for (const days of STREAK_MILESTONE_DAYS) {
    const key = `streak_${days}_earned_at` as keyof UserBadgeRow;
    const at = row?.[key];
    if (at == null || String(at).length === 0) return days;
  }
  return null;
}

/**
 * When this locked badge is the next streak milestone to earn, return progress toward it.
 * Only one locked streak badge matches at a time — omit progress on all other cards.
 */
export function getStreakMilestoneProgress(
  badgeId: string,
  locked: boolean,
  row: UserBadgeRow | null,
  currentStreak: number,
): { current: number; target: number } | null {
  if (!locked || !badgeId.startsWith("streak-")) return null;
  const next = getNextStreakMilestoneDays(row);
  if (next == null) return null;
  const days = Number(badgeId.replace("streak-", ""));
  if (!Number.isFinite(days) || days !== next) return null;
  const target = next;
  const current = Math.min(Math.max(currentStreak, 0), target);
  return { current, target };
}

export function rowToBadgeDefs(row: UserBadgeRow | null): BadgeDef[] {
  const streakBadges: BadgeDef[] = STREAK_MILESTONE_DAYS.map((days) => {
    const key = `streak_${days}_earned_at` as keyof UserBadgeRow;
    const at = row?.[key];
    const earned = at != null && String(at).length > 0;
    const detail =
      earned && typeof at === "string"
        ? new Date(at).toLocaleDateString("en-US", { dateStyle: "medium" })
        : undefined;
    return {
      id: `streak-${days}`,
      title: `${days}-day streak`,
      hint: `Win the puzzle on ${days} consecutive puzzle days.`,
      earned,
      detail,
    };
  });

  const oneCount = Number(row?.stumpd_in_one_count) || 0;
  const twoCount = Number(row?.stumpd_in_two_count) || 0;

  return [
    ...streakBadges,
    {
      id: "stumpd-1",
      title: "Stump'd in one",
      hint: "Solve a puzzle in exactly one guess.",
      earned: oneCount > 0,
      detail: oneCount > 0 ? `${oneCount}×` : undefined,
    },
    {
      id: "stumpd-2",
      title: "Stump'd in two",
      hint: "Solve a puzzle in exactly two guesses.",
      earned: twoCount > 0,
      detail: twoCount > 0 ? `${twoCount}×` : undefined,
    },
  ];
}
