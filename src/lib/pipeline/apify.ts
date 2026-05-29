/**
 * Apify-Anbindung für den Viral-Research-Scan.
 *
 * Ruft je Plattform einen Apify-Actor synchron auf und normalisiert die Treffer
 * zu `ReelHit[]`. Apify ist zentrale Infra (Server-Env `APIFY_TOKEN`), kein
 * teurer AI-Call — fällt daher NICHT unter die „User bringt eigene Keys"-Regel.
 *
 * Hinweis: Actor-Input-Schemas variieren je Actor-Version. Die Normalisierung
 * liest mehrere mögliche Feldnamen defensiv aus.
 */

export type Platform = "instagram" | "tiktok" | "youtube";

export type ReelHit = {
  url: string;
  caption: string;
  author: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  thumbnailUrl: string | null;
};

const ACTORS: Record<Platform, string> = {
  instagram: process.env.APIFY_INSTAGRAM_ACTOR ?? "apify~instagram-scraper",
  tiktok: process.env.APIFY_TIKTOK_ACTOR ?? "clockworks~tiktok-scraper",
  youtube: process.env.APIFY_YOUTUBE_ACTOR ?? "streamers~youtube-scraper",
};

function buildInput(platform: Platform, niche: string, limit: number): Record<string, unknown> {
  switch (platform) {
    case "instagram":
      return {
        search: niche,
        searchType: "hashtag",
        resultsType: "posts",
        resultsLimit: limit,
        addParentData: false,
      };
    case "tiktok":
      return {
        hashtags: [niche.replace(/^#/, "")],
        resultsPerPage: limit,
        shouldDownloadVideos: false,
        shouldDownloadCovers: false,
      };
    case "youtube":
      return {
        searchKeywords: niche,
        maxResults: limit,
        videoType: "shorts",
      };
  }
}

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[,_\s]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function pick(item: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) {
    if (item[k] !== undefined && item[k] !== null) return item[k];
  }
  return null;
}

function normalize(platform: Platform, item: Record<string, unknown>): ReelHit | null {
  const url = pick(item, ["url", "postUrl", "webVideoUrl", "videoUrl", "link"]);
  if (typeof url !== "string" || !url.startsWith("http")) return null;

  const authorRaw = pick(item, ["ownerUsername", "authorMeta", "channelName", "author", "uploaderName"]);
  let author: string | null = null;
  if (typeof authorRaw === "string") author = authorRaw;
  else if (authorRaw && typeof authorRaw === "object") {
    const name = (authorRaw as Record<string, unknown>).name ?? (authorRaw as Record<string, unknown>).nickName;
    if (typeof name === "string") author = name;
  }

  return {
    url,
    caption: String(pick(item, ["caption", "text", "title", "description"]) ?? "").slice(0, 2000),
    author,
    views: asNumber(pick(item, ["videoViewCount", "playCount", "viewCount", "views"])),
    likes: asNumber(pick(item, ["likesCount", "diggCount", "likes", "likeCount"])),
    comments: asNumber(pick(item, ["commentsCount", "commentCount", "comments"])),
    thumbnailUrl:
      (pick(item, ["displayUrl", "thumbnailUrl", "covers", "thumbnail"]) as string | null) ?? null,
  };
}

/**
 * Scant eine Nische über Apify und liefert die viralsten Treffer zuerst
 * (sortiert nach Views, dann Likes).
 */
export async function scanNiche(
  niche: string,
  platform: Platform,
  limit = 12,
): Promise<ReelHit[]> {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    throw new Error(
      "APIFY_TOKEN ist nicht gesetzt. Trag ihn in der Server-Umgebung ein, dann läuft der Scan.",
    );
  }

  const actor = ACTORS[platform];
  const endpoint = `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildInput(platform, niche, limit)),
  });

  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    throw new Error(`Apify-Scan fehlgeschlagen (${res.status}): ${detail}`);
  }

  const items = (await res.json()) as Record<string, unknown>[];
  if (!Array.isArray(items)) throw new Error("Apify lieferte kein Ergebnis-Array");

  const hits = items
    .map((it) => normalize(platform, it))
    .filter((h): h is ReelHit => h !== null);

  hits.sort((a, b) => (b.views ?? 0) - (a.views ?? 0) || (b.likes ?? 0) - (a.likes ?? 0));

  return hits.slice(0, limit);
}
