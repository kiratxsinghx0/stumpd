import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Badges",
  description: "Streak and Stump'd badges for IPL daily and hard mode.",
};

export default function BadgesLayout({ children }: { children: ReactNode }) {
  return children;
}
