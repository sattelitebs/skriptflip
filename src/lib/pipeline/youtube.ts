/**
 * YouTube-Data-API-Quelle für das Sales-Radar.
 *
 * Offizielle, kostenlose API (Quota 10k Einheiten/Tag) — die sauberste legale
 * Live-Quelle für echte Reichweiten-Signale. Bildet das Rückgrat der Hybrid-
 * Architektur (YouTube real + Claude für Verkaufspotenzial + optional Apify
 * für IG/TikTok).
 *
 * Server-Env: `YOUTUBE_API_KEY`.
 */
import type { ReelHit } from "@/lib/pipeline/apify";

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

type SearchItem = { id?: { videoId?: string } };
type VideoItem = {
  id?: string;
  snippet?: {
    title?: string;
    description?: string;
    channelTitle?: string;
    thumbnails?: { medium?: { url?: string }; high?: { url?: string }; default?: { url?: string } };
  };
  statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
};

/**
 * Sucht die meistgesehenen Kurzvideos (≤ 4 Min) einer Nische und liefert echte
 * View-/Like-/Kommentar-Zahlen.
 */
export async function scanYouTube(niche: string, limit = 12): Promise<ReelHit[]> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    throw new Error(
      "YOUTUBE_API_KEY ist nicht gesetzt. Trag ihn in der Server-Umgebung ein, dann läuft der YouTube-Scan.",
    );
  }

  const searchUrl =
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video` +
    `&videoDuration=short&order=viewCount&maxResults=${Math.min(limit, 25)}` +
    `&q=${encodeURIComponent(niche)}&key=${encodeURIComponent(key)}`;

  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) {
    const detail = (await searchRes.text().catch(() => "")).slice(0, 300);
    throw new Error(`YouTube-Suche fehlgeschlagen (${searchRes.status}): ${detail}`);
  }
  const searchData = (await searchRes.json()) as { items?: SearchItem[] };
  const ids = (searchData.items ?? [])
    .map((it) => it.id?.videoId)
    .filter((v): v is string => typeof v === "string");

  if (ids.length === 0) return [];

  const videosUrl =
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics` +
    `&id=${ids.join(",")}&key=${encodeURIComponent(key)}`;

  const videosRes = await fetch(videosUrl);
  if (!videosRes.ok) {
    const detail = (await videosRes.text().catch(() => "")).slice(0, 300);
    throw new Error(`YouTube-Details fehlgeschlagen (${videosRes.status}): ${detail}`);
  }
  const videosData = (await videosRes.json()) as { items?: VideoItem[] };

  const hits: ReelHit[] = (videosData.items ?? []).map((v) => {
    const sn = v.snippet ?? {};
    const st = v.statistics ?? {};
    const thumb =
      sn.thumbnails?.high?.url ?? sn.thumbnails?.medium?.url ?? sn.thumbnails?.default?.url ?? null;
    return {
      url: `https://www.youtube.com/watch?v=${v.id}`,
      caption: [sn.title, sn.description].filter(Boolean).join(" — ").slice(0, 2000),
      author: sn.channelTitle ?? null,
      views: asNumber(st.viewCount),
      likes: asNumber(st.likeCount),
      comments: asNumber(st.commentCount),
      thumbnailUrl: thumb,
    };
  });

  hits.sort((a, b) => (b.views ?? 0) - (a.views ?? 0) || (b.likes ?? 0) - (a.likes ?? 0));
  return hits.slice(0, limit);
}
