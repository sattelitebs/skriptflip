// Hookvana Gratis-Checker — Heuristik nach Torstens echten IG-Regeln.
// 0 KI-Kosten: reine Regel-Logik, client- UND server-nutzbar.
// Kein Ersatz für den KI-Umbau — ein schneller Ampel-Check, der zeigt WARUM
// ein Hook zieht oder nicht. Leitregeln:
//   - Schmerz vor Werkzeug (nicht mit Tool/Meta-Begriff starten)
//   - kein "KI"/Jargon/Meta-Marketing/Hype im Hook
//   - 2-Sekunden-Klarheit (kurz, konkret, direkt)

export type CheckLevel = "gut" | "warnung" | "problem";

export type CheckSignal = {
  level: CheckLevel;
  titel: string;
  text: string;
};

export type HookCheck = {
  score: number; // 0..100
  ampel: "rot" | "gelb" | "gruen";
  signale: CheckSignal[];
};

// Jargon / Meta-Marketing / "KI" — Insider-Begriffe, die einen kalten Zuschauer
// in den ersten 2 Sekunden abhängen. "Werkzeug statt Schmerz."
const JARGON = [
  "ki", "a.i.", "künstliche intelligenz", "kuenstliche intelligenz", "algorithmus",
  "content", "reichweite", "engagement", "funnel", "leadmagnet", "conversion",
  "workflow", "automation", "prompt", "call to action", "cta", "branding",
  "personal brand", "sichtbarkeit", "positionierung", "zielgruppe",
  "framework", "mindset", "roi", "kpi",
];

// Leere Hype-/Superlativ-Begriffe (Hype-Müdigkeit). Konkrete Zahlen sind NICHT
// Hype — die belohnen wir separat.
const HYPE = [
  "geheim", "geheimnis", "trick", "hack", "krass", "unglaublich",
  "explodier", "gamechanger", "game-changer", "revolution", "life-changing",
  "life changing", "garantiert", "über nacht", "ueber nacht", "quantensprung",
  "der eine trick", "nie wieder", "für immer", "fuer immer",
];

// Marken-Tabu (globale Regel): "klauen"/"klau"/"stehlen" — Torsten lehnt ab.
const TABU = ["klau", "stehl"];

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const hasAny = (haystack: string, needles: string[]) =>
  needles.filter((n) => haystack.includes(n));

/**
 * Bewertet einen Hook nach Torstens Regeln. Transparent: jeder Punktabzug hat
 * ein sichtbares "warum". Startwert 100, Abzüge/Boni je Signal.
 */
export function checkHook(rawInput: string): HookCheck {
  const hook = rawInput.trim();
  const lower = hook.toLowerCase();
  const words = wordCount(hook);
  const signale: CheckSignal[] = [];
  let score = 100;

  // --- Marken-Tabu: harter Ausschluss ---
  const tabu = hasAny(lower, TABU);
  if (tabu.length > 0) {
    score -= 35;
    signale.push({
      level: "problem",
      titel: "Tabu-Wort",
      text: 'Wörter wie „klauen" oder „stehlen" wirken unseriös. Sag lieber „lernen von", „nachbauen" oder „verstehen".',
    });
  }

  // --- Jargon / Meta-Marketing / KI ---
  const jargon = hasAny(lower, JARGON);
  if (jargon.length > 0) {
    score -= Math.min(30, 12 + jargon.length * 6);
    signale.push({
      level: "problem",
      titel: "Jargon statt Schmerz",
      text: `Begriffe wie „${jargon[0]}" sind Insider-Sprache. Ein kalter Zuschauer will seinen Schmerz hören, nicht dein Werkzeug. Fang beim Problem an, nicht beim Tool.`,
    });
  }

  // --- Hype / leere Superlative ---
  const hype = hasAny(lower, HYPE);
  if (hype.length > 0) {
    score -= Math.min(25, 10 + hype.length * 6);
    signale.push({
      level: "warnung",
      titel: "Hype-Müdigkeit",
      text: `„${hype[0]}" haben die Leute tausendmal gehört. Ersetz die leere Behauptung durch eine konkrete Zahl oder eine echte Situation.`,
    });
  }

  // --- 2-Sekunden-Klarheit: Länge ---
  if (words === 0) {
    return { score: 0, ampel: "rot", signale: [] };
  }
  if (words > 20) {
    score -= 20;
    signale.push({
      level: "problem",
      titel: "Zu lang",
      text: `${words} Wörter — der Hook muss in 2 Sekunden sitzen. Streich alles bis auf den einen Gedanken (Ziel: unter 15 Wörter).`,
    });
  } else if (words > 14) {
    score -= 8;
    signale.push({
      level: "warnung",
      titel: "Etwas lang",
      text: `${words} Wörter. Geht kürzer? Je schneller der Kern sitzt, desto weniger Leute scrollen weg.`,
    });
  } else {
    signale.push({
      level: "gut",
      titel: "Knackige Länge",
      text: `${words} Wörter — kurz genug, dass der Kern sofort ankommt.`,
    });
  }

  // --- Konkrete Zahl = Schmerz/Beweis greifbar ---
  const hatZahl = /\d/.test(hook);
  if (hatZahl) {
    score += 6;
    signale.push({
      level: "gut",
      titel: "Konkrete Zahl",
      text: "Eine harte Zahl macht den Hook greifbar und glaubwürdig — genau richtig.",
    });
  } else {
    signale.push({
      level: "warnung",
      titel: "Keine Zahl",
      text: "Ohne Zahl bleibt der Hook vage. Eine konkrete Zahl (Zeitraum, Betrag, Menge) zieht härter.",
    });
  }

  // --- Direkte Ansprache: du/dein/dich ---
  const hatDu = /\b(du|dein|deine|deinen|deiner|dich|dir)\b/i.test(hook);
  if (hatDu) {
    score += 4;
    signale.push({
      level: "gut",
      titel: "Direkte Ansprache",
      text: "Du sprichst den Zuschauer direkt an — das holt ihn rein.",
    });
  }

  // --- Werkzeug statt Schmerz: startet der Hook mit einem Jargon-Begriff? ---
  const erstesWort = lower.split(/\s+/)[0] ?? "";
  const startetMitTool = JARGON.some(
    (j) => erstesWort === j || erstesWort.startsWith(j),
  );
  if (startetMitTool) {
    score -= 10;
    signale.push({
      level: "warnung",
      titel: "Startet beim Werkzeug",
      text: "Der erste Wort ist ein Tool-/Meta-Begriff. Dreh es um: erst der Schmerz oder das Ergebnis, dann (wenn überhaupt) das Werkzeug.",
    });
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const ampel = score >= 75 ? "gruen" : score >= 50 ? "gelb" : "rot";
  return { score, ampel, signale };
}
