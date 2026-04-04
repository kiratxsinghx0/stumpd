import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/site";

type Entry = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

/** Public indexable routes — update when adding marketing/legal pages. */
const entries: Entry[] = [
  { path: "", changeFrequency: "daily", priority: 1 },
  { path: "/stumpd", changeFrequency: "daily", priority: 0.95 },
  { path: "/how-to-play", changeFrequency: "weekly", priority: 0.8 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
  { path: "/cookies", changeFrequency: "monthly", priority: 0.35 },
  { path: "/privacy", changeFrequency: "monthly", priority: 0.35 },
  { path: "/terms", changeFrequency: "monthly", priority: 0.35 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return entries.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
