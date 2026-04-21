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

export type RewardEligibility = {
  eligible: boolean;
  rank: number | null;
  /** Position in last week’s full leaderboard (for copy in UI) */
  last_week_rank: number | null;
  amount: number | null;
  week_number: number;
  already_claimed: boolean;
  claim_status: string | null;
};

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
    return json.data;
  } catch {
    return null;
  }
}

export async function submitRewardClaim(data: {
  instagram_username: string;
  reddit_username: string;
  upi_id: string;
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
