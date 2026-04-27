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
  { path: "/archive", changeFrequency: "daily", priority: 0.7 },
  { path: "/challenge", changeFrequency: "daily", priority: 0.7 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.7 },
  { path: "/blog/what-is-stumpd", changeFrequency: "monthly", priority: 0.6 },
  { path: "/blog/the-inspiration-behind-stumpd", changeFrequency: "monthly", priority: 0.6 },
  { path: "/blog/the-journey-of-stumpd", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
  { path: "/rewards/claim", changeFrequency: "weekly", priority: 0.45 },
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
