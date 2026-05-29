import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dein Zugang zu skriptflip – die Maschine hinter verkaufendem Content",
  description:
    "Das System aus dem Webinar als Tool: Sales-Radar findet in jeder Nische die Themen, die verkaufen, schreibt dir die Hook und liefert sprechfertige Skripte. Lifetime oder Jahresabo.",
};

// Digistore-Links später eintragen (Phase B Webhook ist bereits verdrahtet).
const DIGISTORE = {
  lifetimeEarlybird: "#",
  lifetimeRegular: "#",
  yearly: "#",
};

export default function AngebotPage() {
  return (
    <>
      {/* Reveal-Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(254,220,49,0.18),transparent_60%)]"
        />
        <div className="mx-auto max-w-4xl px-6 pt-20 pb-14 text-center sm:pt-28">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-1.5 text-xs font-medium text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-[var(--color-brand)]" />
            Das System aus dem Webinar — als Tool
          </div>

          <h1 className="text-balance text-4xl font-black uppercase leading-[1.05] tracking-tight sm:text-6xl">
            Die Maschine,
            <br />
            <span className="bg-[var(--color-brand)] px-3 text-black">die ich mir gebaut habe.</span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-pretty text-lg text-zinc-300">
            Im Webinar hast du das Framework gesehen. Das hier ist das Werkzeug, das es für dich
            erledigt: <strong className="text-white">skriptflip</strong> mit dem{" "}
            <strong className="text-[var(--color-brand)]">Sales-Radar</strong> – Radar, Hook und
            Verkauf in einem Workflow, statt stundenlang selbst zu recherchieren und zu raten.
          </p>

          <a
            href="#preise"
            className="mt-10 inline-block rounded-full bg-[var(--color-brand)] px-10 py-4 text-lg font-bold text-black transition hover:bg-[var(--color-brand-hover)]"
          >
            Zugang sichern →
          </a>
        </div>
      </section>

      {/* Die 3 Hebel als Produkt-Säulen */}
      <section className="border-y border-[var(--color-border)] bg-[var(--color-card)] py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-black uppercase leading-tight sm:text-4xl">
            Drei Hebel. <span className="text-[var(--color-brand)]">Ein Workflow.</span>
          </h2>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            <Pillar
              title="Radar"
              desc="Gib eine Nische ein. Das Radar holt die stärksten Videos und bewertet jedes nach Verkaufspotenzial – nicht nach reiner Reichweite. Du siehst sofort, welche Themen Käufer bringen."
            />
            <Pillar
              title="Hook"
              desc="Zu jedem Treffer die Hook-Logik, die in 3 Sekunden stoppt – plus fertige Hook-Varianten, die du direkt übernehmen kannst."
            />
            <Pillar
              title="Verkauf"
              desc="Aus jedem viralen Muster baut dir die KI 3 eigene, sprechfertige Skripte mit eingebautem Verkaufs-Move – der nicht nach Werbung klingt."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="preise" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-4xl font-black uppercase leading-tight sm:text-5xl">
              Einmal zahlen. <span className="text-[var(--color-brand)]">Für immer nutzen.</span>
            </h2>
            <p className="mt-4 text-lg text-zinc-400">
              Du bringst deine eigenen API-Keys mit – wir verdienen nichts an deiner Nutzung.
              Kein Abo-Druck, keine versteckten Verbrauchskosten.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-6 lg:grid-cols-3">
            {/* Lifetime Earlybird */}
            <PlanCard
              highlight
              badge="Earlybird"
              name="Lifetime"
              price="197 €"
              note="einmalig · solange Earlybird läuft"
              href={DIGISTORE.lifetimeEarlybird}
              cta="Earlybird sichern"
              features={[
                "Voller Zugang – für immer",
                "Sales-Radar in jeder Nische",
                "Hook-Varianten + 3 Skripte pro Treffer",
                "Repurposing-Formate + Voiceover",
                "Alle künftigen Updates inklusive",
                "Eigene API-Keys (keine Nutzungskosten an uns)",
              ]}
            />
            {/* Lifetime regulär */}
            <PlanCard
              name="Lifetime"
              price="297 €"
              note="einmalig · regulär"
              href={DIGISTORE.lifetimeRegular}
              cta="Lifetime holen"
              features={[
                "Voller Zugang – für immer",
                "Sales-Radar in jeder Nische",
                "Hook-Varianten + 3 Skripte pro Treffer",
                "Repurposing-Formate + Voiceover",
                "Alle künftigen Updates inklusive",
              ]}
            />
            {/* Jahresabo */}
            <PlanCard
              name="Jahresabo"
              price="97 €"
              note="pro Jahr"
              href={DIGISTORE.yearly}
              cta="Jahr starten"
              features={[
                "Voller Zugang für 12 Monate",
                "Sales-Radar in jeder Nische",
                "Hook-Varianten + 3 Skripte pro Treffer",
                "Repurposing-Formate + Voiceover",
                "Updates während der Laufzeit",
              ]}
            />
          </div>

          <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-zinc-500">
            Nach dem Kauf wird dein Account automatisch freigeschaltet. Du loggst dich ein, trägst
            deine OpenAI- und Anthropic-Keys ein – und das Radar läuft.
          </p>
        </div>
      </section>

      {/* Schluss-CTA */}
      <section className="border-t border-[var(--color-border)] py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-balance text-3xl font-black uppercase leading-tight sm:text-4xl">
            Hör auf, Reichweite zu jagen.
            <br />
            <span className="bg-[var(--color-brand)] px-3 text-black">Fang an zu verkaufen.</span>
          </h2>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#preise"
              className="rounded-full bg-[var(--color-brand)] px-10 py-4 text-lg font-bold text-black transition hover:bg-[var(--color-brand-hover)]"
            >
              Zugang sichern →
            </a>
            <Link
              href="/webinar"
              className="rounded-full border border-[var(--color-border)] px-8 py-4 text-base font-semibold text-white transition hover:bg-white/5"
            >
              Erst ins Webinar
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Pillar({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-black p-6">
      <h3 className="text-2xl font-black uppercase tracking-tight text-[var(--color-brand)]">{title}</h3>
      <p className="mt-3 text-zinc-400">{desc}</p>
    </div>
  );
}

function PlanCard({
  name,
  price,
  note,
  href,
  cta,
  features,
  highlight = false,
  badge,
}: {
  name: string;
  price: string;
  note: string;
  href: string;
  cta: string;
  features: string[];
  highlight?: boolean;
  badge?: string;
}) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl border bg-[var(--color-card)] p-8 ${
        highlight
          ? "border-2 border-[var(--color-brand)] shadow-2xl shadow-[var(--color-brand)]/10"
          : "border-[var(--color-border)]"
      }`}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-brand)] px-3 py-1 text-xs font-bold uppercase tracking-wider text-black">
          {badge}
        </div>
      )}
      <h3
        className={`text-lg font-bold uppercase tracking-wider ${
          highlight ? "text-[var(--color-brand)]" : "text-zinc-400"
        }`}
      >
        {name}
      </h3>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-5xl font-black">{price}</span>
      </div>
      <p className="mt-2 text-sm text-zinc-500">{note}</p>
      <ul className="mt-6 flex-1 space-y-3 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-3">
            <span className="mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-[var(--color-brand)] text-xs font-black text-black">
              ✓
            </span>
            <span className="text-zinc-200">{f}</span>
          </li>
        ))}
      </ul>
      <a
        href={href}
        className={`mt-8 rounded-full px-6 py-3 text-center font-bold transition ${
          highlight
            ? "bg-[var(--color-brand)] text-black hover:bg-[var(--color-brand-hover)]"
            : "border border-[var(--color-border)] text-white hover:bg-white/5"
        }`}
      >
        {cta}
      </a>
    </div>
  );
}
