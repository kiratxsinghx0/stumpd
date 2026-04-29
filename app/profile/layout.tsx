import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your Stumpd account, badges, and leaderboard.",
};

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return children;
}
