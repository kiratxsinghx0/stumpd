/** Public assets in `/public/badges/` — filenames from design export. */
export function badgeImageSrc(modeId: "daily" | "hard", badgeId: string): string {
  const modePrefix = modeId === "daily" ? "normal_mode" : "hard_mode";
  if (badgeId.startsWith("streak-")) {
    const days = badgeId.replace("streak-", "");
    return `/badges/${modePrefix}_${days}_days_streak.png`;
  }
  if (badgeId === "stumpd-1") {
    return `/badges/${modePrefix}_stumpd_in_one.png`;
  }
  if (badgeId === "stumpd-2") {
    if (modeId === "daily") return "/badges/normal_mode_stumpd_two.png";
    return "/badges/hard_mode_stumpd_in_two.png";
  }
  return "";
}
