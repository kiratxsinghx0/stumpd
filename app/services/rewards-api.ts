const LS_TOKEN_KEY = "stumpd_auth_token";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LS_TOKEN_KEY);
}

export type WeeklyWinner = {
  rank: number;
  email: string;
  games_won: number;
  points: number;
};

export type WeeklyWinnersResponse = {
  week_number: number;
  winners: WeeklyWinner[];
};

export type SavedRewardClaim = {
  instagram_username: string;
  reddit_username: string;
  upi_id: string;
  insta_follow_done: boolean;
  reddit_follow_done: boolean;
  insta_story_done: boolean;
  reddit_post_done: boolean;
};

export type RewardEligibility = {
  eligible: boolean;
  rank: number | null;
  /** Position in last week’s full leaderboard (for copy in UI) */
  last_week_rank: number | null;
  amount: number | null;
  week_number: number;
  already_claimed: boolean;
  claim_status: string | null;
  /** Saved claim for this week, if any (for form prefill). */
  claim: SavedRewardClaim | null;
};

/** User cannot edit claim after admin marks paid or rejected. */
export function isRewardClaimLocked(eligibility: RewardEligibility | null | undefined): boolean {
  if (!eligibility?.already_claimed) return false;
  const s = eligibility.claim_status;
  return s === "paid" || s === "rejected";
}

/** e.g. 9 → "9th" for simple rank labels */
export function rankOrdinal(rank: number): string {
  const r = Math.floor(rank);
  const suffix = r === 1 ? "st" : r === 2 ? "nd" : r === 3 ? "rd" : "th";
  return `${r}${suffix}`;
}

export async function fetchWeeklyWinners(weekNumber?: number): Promise<WeeklyWinnersResponse> {
  const qs = weekNumber ? `?week_number=${weekNumber}` : "";
  const res = await fetch(`/api/rewards/winners${qs}`);
  const json = await res.json();
  if (!json.success) return { week_number: 0, winners: [] };
  return json.data;
}

export type ClaimResult = {
  id: number;
  rank: number;
  amount: number;
  status: string;
  updated?: boolean;
  insta_follow_done?: boolean;
  reddit_follow_done?: boolean;
  insta_story_done?: boolean;
  reddit_post_done?: boolean;
};

export async function fetchRewardEligibility(): Promise<RewardEligibility | null> {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch("/api/rewards/eligibility", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.success) return null;
    const d = json.data;
    return {
      ...d,
      claim: d.claim != null ? d.claim : null,
    } as RewardEligibility;
  } catch {
    return null;
  }
}

export async function submitRewardClaim(data: {
  instagram_username: string;
  reddit_username: string;
  upi_id: string;
  insta_follow_done: boolean;
  reddit_follow_done: boolean;
  insta_story_done: boolean;
  reddit_post_done: boolean;
}): Promise<{ success: boolean; message: string; data?: ClaimResult }> {
  const token = getToken();
  if (!token) return { success: false, message: "Not logged in" };
  const res = await fetch("/api/rewards/claim", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}
