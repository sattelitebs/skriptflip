import type { Metadata } from "next";
import WebinarSignupForm from "./WebinarSignupForm";

export const metadata: Metadata = {
  title: "Kostenloses Live-Webinar – skriptflip",
  description:
    "Viral ist nicht genug. In diesem kostenlosen Live-Webinar zeige ich dir das System, mit dem du in jeder Nische Content findest, der nicht nur Reichweite bringt – sondern Käufer.",
};

export default function WebinarPage() {
  return (
    <>
      {/* Hero / Opt-in */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(254,220,49,0.18),transparent_60%)]"
        />
        <div className="mx-auto max-w-3xl px-6 pt-20 pb-16 text-center sm:pt-28">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-1.5 text-xs font-medium text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-[var(--color-brand)]" />
            Kostenloses Live-Webinar · begrenzte Plätze
          </div>

          <h1 className="text-balance text-4xl font-black uppercase leading-[1.05] tracking-tight sm:text-5xl">
            Viral ist nicht genug.
            <br />
            <span className="bg-[var(--color-brand)] px-3 text-black">Dein Content muss verkaufen.</span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-pretty text-lg text-zinc-300">
            Die meisten Creator jagen Reichweite und wundern sich, warum nichts hängenbleibt –
            geschweige denn verkauft. In diesem kostenlosen Live-Webinar zeige ich dir das
            System, das ich mir gebaut habe, um in <strong className="text-white">jeder Nische</strong>{" "}
            die Themen zu finden, die <strong className="text-white">Käufer</strong> bringen –
            nicht nur Klatschen.
          </p>

          <div className="mx-auto mt-10 max-w-md">
            <WebinarSignupForm />
          </div>
        </div>
      </section>

      {/* Was du lernst — die 3 Hebel (ohne das Tool zu nennen) */}
      <section className="border-y border-[var(--color-border)] bg-[var(--color-card)] py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-black uppercase leading-tight sm:text-4xl">
            Was du in 60 Minuten <span className="text-[var(--color-brand)]">mitnimmst</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-zinc-400">
            Kein Theorie-Blabla. Ein konkretes Framework aus drei Hebeln, das du sofort anwenden kannst.
          </p>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            <Lever
              n="01"
              title="Radar"
              desc="Wie du in deiner Nische die Themen erkennst, die nicht nur laut sind, sondern wirklich ziehen UND verkaufen. Schluss mit Raten, was funktionieren könnte."
            />
            <Lever
              n="02"
              title="Hook"
              desc="Die Hook-Struktur, die in den ersten 3 Sekunden entscheidet, ob jemand bleibt oder weiterswipet. Inklusive der Formel, die hinter fast jedem Viral-Video steckt."
            />
            <Lever
              n="03"
              title="Verkauf"
              desc="Wie du im Content selbst verkaufst – ohne dass es nach Werbung klingt. Der Teil, den 95 % der Creator komplett auslassen und damit Umsatz liegen lassen."
            />
          </div>
        </div>
      </section>

      {/* Für wen */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-center text-3xl font-black uppercase leading-tight sm:text-4xl">
            Für wen das <span className="text-[var(--color-brand)]">ist</span>
          </h2>
          <ul className="mx-auto mt-10 flex max-w-xl flex-col gap-4">
            <Check>Creator, Coaches und Selbstständige, die mit Kurzvideos verkaufen wollen.</Check>
            <Check>Alle, die viel posten, aber das Gefühl haben: Reichweite ja, Umsatz nein.</Check>
            <Check>Wer keine Lust mehr hat, jeden Tag bei null vor dem leeren Editor zu sitzen.</Check>
            <Check>Wer ein System will statt Bauchgefühl – wiederholbar, in jeder Nische.</Check>
          </ul>

          <div className="mt-12 text-center">
            <a
              href="/webinar"
              className="inline-block rounded-full bg-[var(--color-brand)] px-10 py-4 text-lg font-bold text-black transition hover:bg-[var(--color-brand-hover)]"
            >
              Jetzt kostenlos Platz sichern →
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

function Lever({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="relative">
      <div className="text-6xl font-black text-[var(--color-brand)]/20">{n}</div>
      <h3 className="mt-2 text-2xl font-black uppercase tracking-tight">{title}</h3>
      <p className="mt-3 text-zinc-400">{desc}</p>
    </div>
  );
}

function Check({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-[var(--color-brand)] text-xs font-black text-black">
        ✓
      </span>
      <span className="text-zinc-200">{children}</span>
    </li>
  );
}
