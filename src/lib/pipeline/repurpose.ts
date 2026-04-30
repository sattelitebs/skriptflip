import Anthropic from "@anthropic-ai/sdk";

export type RepurposeFormats = {
  tiktok_hook_15s: string;
  reel_30s: string;
  yt_short_60s: string;
  yt_long_outline: string;
  ig_caption: string;
  tweet: string;
  linkedin_post: string;
  newsletter_snippet: string;
};

const SYSTEM = `Du repurposed ein virales Kurzvideo-Skript in 8 Formate für unterschiedliche Plattformen.
Jedes Format hat seine eigenen Regeln:

- tiktok_hook_15s: 15 Sekunden Sprechzeit (≈ 35-45 Wörter). Maximaler Hook in Zeile 1.
- reel_30s: 30 Sekunden (≈ 70-90 Wörter). Hook + 1 Story-Beat + CTA.
- yt_short_60s: 60 Sekunden (≈ 140-170 Wörter). Hook + Aufbau + Pointe + CTA.
- yt_long_outline: 5-Minuten-Video-Outline mit 4-6 nummerierten Kapiteln, jeweils 1-2 Sätzen Inhalt + jeweils einer Frage als Cliffhanger.
- ig_caption: Instagram-Caption, 3-5 Absätze, persönlich, mit Story-Hook in Zeile 1, endet mit klarer Frage. Keine Hashtag-Liste.
- tweet: 1 Tweet, max 270 Zeichen, knackig, eigenständig.
- linkedin_post: LinkedIn-Post 5-8 Absätze, professioneller Ton, mit "Lessons Learned"-Drall.
- newsletter_snippet: Newsletter-Block 100-150 Wörter, persönliche Anrede, mit P.S.

Sprache: deutsch, DU-Form, keine Emojis, keine Hashtags im Text.

Antworte AUSSCHLIESSLICH mit gültigem JSON in diesem Format, ohne Markdown-Codefences:
{
  "tiktok_hook_15s": "string",
  "reel_30s": "string",
  "yt_short_60s": "string",
  "yt_long_outline": "string",
  "ig_caption": "string",
  "tweet": "string",
  "linkedin_post": "string",
  "newsletter_snippet": "string"
}`;

export async function repurposeScript(
  title: string,
  script: string,
  apiKey: string,
): Promise<RepurposeFormats> {
  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Quell-Skript:\nTitel: ${title}\n\n${script}\n\nGenerier die 8 Format-Versionen.`,
      },
    ],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("Claude lieferte keinen Text-Block");

  const raw = block.text.trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Claude-Antwort enthielt kein JSON");

  const parsed = JSON.parse(raw.slice(start, end + 1)) as RepurposeFormats;
  const required: (keyof RepurposeFormats)[] = [
    "tiktok_hook_15s",
    "reel_30s",
    "yt_short_60s",
    "yt_long_outline",
    "ig_caption",
    "tweet",
    "linkedin_post",
    "newsletter_snippet",
  ];
  for (const key of required) {
    if (typeof parsed[key] !== "string" || !parsed[key].trim()) {
      throw new Error(`Repurpose-JSON fehlt Feld ${key}`);
    }
  }
  return parsed;
}
