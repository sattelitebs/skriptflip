import { NextResponse } from "next/server";
import { rewriteHook, type RewriteMode } from "@/lib/hook/rewrite";
import { getCentralAnthropicKey } from "@/lib/hook/central-key";
import { peekTrial, consumeTrial, FREE_PER_EMAIL } from "@/lib/hook/trial";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_INPUT = 400;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function POST(request: Request) {
  let body: { mode?: string; input?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Body" }, { status: 400 });
  }

  const mode = body.mode === "umschreiben" ? "umschreiben" : "thema";
  const input = (body.input ?? "").trim();
  const email = (body.email ?? "").trim();

  if (!input) {
    return NextResponse.json({ error: "Gib ein Thema oder einen Hook ein." }, { status: 400 });
  }
  if (input.length > MAX_INPUT) {
    return NextResponse.json(
      { error: `Bitte kürzer fassen (max. ${MAX_INPUT} Zeichen).` },
      { status: 400 },
    );
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Bitte gib eine gültige E-Mail ein.", need_email: true },
      { status: 400 },
    );
  }

  const ip = clientIp(request);

  // Kontingent prüfen (server-seitig), bevor wir Tokens ausgeben.
  const trial = await peekTrial(email, ip);
  if (!trial.allowed) {
    const message =
      trial.reason === "ip_limit"
        ? "Für heute ist von hier aus Schluss. Hol dir Vollzugang für unbegrenzte Umbauten."
        : `Deine ${FREE_PER_EMAIL} Gratis-Umbauten sind aufgebraucht. Hol dir Vollzugang für unbegrenzte Umbauten.`;
    return NextResponse.json(
      { error: message, paywall: true, reason: trial.reason },
      { status: 402 },
    );
  }

  let apiKey: string;
  try {
    apiKey = getCentralAnthropicKey();
  } catch {
    return NextResponse.json(
      { error: "Der KI-Umbau ist gerade nicht verfügbar. Versuch es später nochmal." },
      { status: 503 },
    );
  }

  try {
    const variants = await rewriteHook(mode as RewriteMode, input, apiKey);
    // Erst nach erfolgreichem Umbau verbuchen — ein Fehlversuch kostet kein Kontingent.
    const { remaining } = await consumeTrial(email, ip);
    return NextResponse.json({ variants, remaining });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unbekannter Fehler beim Umbau" },
      { status: 500 },
    );
  }
}
