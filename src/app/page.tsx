import Link from "next/link";

export default function Home() {
  return (
    <>
      <Hero />
      <SocialProof />
      <Features />
      <HowItWorks />
      <Pricing />
      <FAQ />
      <FinalCTA />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(254,220,49,0.18),transparent_60%)]"
      />
      <div className="mx-auto max-w-5xl px-6 pt-24 pb-20 text-center sm:pt-32">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-1.5 text-xs font-medium text-zinc-300">
          <span className="h-2 w-2 rounded-full bg-[var(--color-brand)]" />
          Neu: KI-Skript-Analyse für TikTok, Instagram & YouTube
        </div>

        <h1 className="text-balance text-4xl font-black uppercase leading-[1.0] tracking-tight sm:text-6xl">
          Lerne von viralen Videos.
          <br />
          <span className="bg-[var(--color-brand)] px-3 text-black">Schreib dein eigenes.</span>
        </h1>

        <p className="mx-auto mt-8 max-w-2xl text-pretty text-lg text-zinc-300 sm:text-xl">
          Füge einen TikTok-, Instagram- oder YouTube-Link ein. Die KI zerlegt das
          virale Skript in seine Bausteine und liefert dir <strong className="text-white">3 eigene Versionen</strong> –
          mit Hook, Hashtags und Captions. In 60 Sekunden.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/register"
            className="w-full rounded-full bg-[var(--color-brand)] px-8 py-4 text-base font-bold text-black transition hover:bg-[var(--color-brand-hover)] sm:w-auto"
          >
            3 Analysen kostenlos starten →
          </Link>
          <a
            href="#so-gehts"
            className="w-full rounded-full border border-[var(--color-border)] px-8 py-4 text-base font-semibold text-white transition hover:bg-white/5 sm:w-auto"
          >
            So funktioniert&apos;s
          </a>
        </div>

        <p className="mt-5 text-sm text-zinc-500">
          Keine Kreditkarte. In 30 Sekunden registriert.
        </p>

        {/* Demo-Mockup */}
        <div className="mt-16 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-2 shadow-2xl shadow-[var(--color-brand)]/10">
          <div className="rounded-xl bg-black p-6 sm:p-10">
            <div className="mb-4 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-zinc-700" />
              <span className="h-3 w-3 rounded-full bg-zinc-700" />
              <span className="h-3 w-3 rounded-full bg-zinc-700" />
              <span className="ml-3 text-xs text-zinc-500">skriptflip · Dashboard</span>
            </div>
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-left sm:p-6">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Virales Video einfügen
              </label>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <div className="flex-1 rounded-md border border-[var(--color-border)] bg-black px-4 py-3 text-sm text-zinc-400">
                  https://www.tiktok.com/@user/video/...
                </div>
                <button className="rounded-md bg-[var(--color-brand)] px-5 py-3 text-sm font-bold text-black">
                  Analysieren
                </button>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <Card title="Transkript" />
                <Card title="Hook-Analyse" />
                <Card title="3 neue Skripte" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Card({ title }: { title: string }) {
  return (
    <div className="rounded-md border border-[var(--color-border)] bg-black p-4 text-left">
      <div className="mb-2 h-2 w-12 rounded bg-[var(--color-brand)]" />
      <p className="text-sm font-semibold text-white">{title}</p>
      <div className="mt-3 space-y-1.5">
        <div className="h-2 w-full rounded bg-zinc-800" />
        <div className="h-2 w-5/6 rounded bg-zinc-800" />
        <div className="h-2 w-3/4 rounded bg-zinc-800" />
      </div>
    </div>
  );
}

function SocialProof() {
  return (
    <section className="border-y border-[var(--color-border)] bg-[var(--color-card)] py-10">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-6 text-center text-sm uppercase tracking-wider text-zinc-500">
          Funktioniert mit den größten Plattformen
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-zinc-400">
          <span className="text-2xl font-black">TikTok</span>
          <span className="text-2xl font-black">Instagram</span>
          <span className="text-2xl font-black">YouTube</span>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    {
      title: "Sofort-Transkription",
      desc: "URL einfügen, Text fertig. TikTok, Reels, Shorts – alles in Sekunden.",
    },
    {
      title: "Hook-Analyse",
      desc: "Was macht die ersten 3 Sekunden süchtig? Die KI zerlegt jeden Trigger.",
    },
    {
      title: "3 Skript-Varianten",
      desc: "Analytisch, aspirational, anthropologisch. Drei Winkel, drei eigene Skripte.",
    },
    {
      title: "Captions & Hashtags",
      desc: "Plattformspezifisch. Inklusive Musik-Empfehlung. Direkt copy-paste-fertig.",
    },
    {
      title: "Bulk-Modus",
      desc: "Bis zu 20 Links auf einmal. Für deine ganze Content-Pipeline auf einen Schlag.",
    },
    {
      title: "Excel- & PDF-Export",
      desc: "Alles strukturiert exportieren. Für dich, dein Team, deine VAs.",
    },
  ];
  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-4xl font-black uppercase leading-tight sm:text-5xl">
            Alles, was du brauchst, um <span className="text-[var(--color-brand)]">viral zu gehen</span>.
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            Keine Tool-Sammelsurium. Kein Tab-Chaos. Ein Workflow – von Link bis fertigem Skript.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <div
              key={it.title}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 transition hover:border-[var(--color-brand)]/40"
            >
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-[var(--color-brand)] text-lg font-black text-black">
                ✓
              </div>
              <h3 className="text-lg font-bold">{it.title}</h3>
              <p className="mt-2 text-sm text-zinc-400">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Link einfügen",
      desc: "Kopiere die URL eines viralen Videos – TikTok, Reel, Short. Klick auf Analysieren.",
    },
    {
      n: "02",
      title: "KI macht den Rest",
      desc: "Transkription, Hook-Analyse, Trigger, Retention-Bogen. Alles in unter 60 Sekunden.",
    },
    {
      n: "03",
      title: "Dein Skript",
      desc: "Du bekommst 3 eigene Skripte mit Caption + Hashtags. Aufnehmen, posten, viral gehen.",
    },
  ];
  return (
    <section id="so-gehts" className="border-y border-[var(--color-border)] bg-[var(--color-card)] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-4xl font-black uppercase leading-tight sm:text-5xl">
            In <span className="text-[var(--color-brand)]">3 Schritten</span> zum viralen Skript.
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            Hör auf, vor dem leeren Editor zu sitzen. Lass die KI die Arbeit machen.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="relative">
              <div className="text-7xl font-black text-[var(--color-brand)]/20">{s.n}</div>
              <h3 className="mt-2 text-2xl font-bold">{s.title}</h3>
              <p className="mt-3 text-zinc-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="preise" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-4xl font-black uppercase leading-tight sm:text-5xl">
            Ein fairer Preis. <span className="text-[var(--color-brand)]">Keine Tricks.</span>
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            Erst testen. Dann zahlen. Jederzeit kündigen.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-3xl gap-6 md:grid-cols-2">
          {/* Free */}
          <div className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8">
            <div>
              <h3 className="text-lg font-bold uppercase tracking-wider text-zinc-400">Test</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-5xl font-black">0 €</span>
                <span className="text-zinc-500">für immer</span>
              </div>
              <p className="mt-2 text-sm text-zinc-400">Zum Reinschnuppern. Keine Kreditkarte.</p>
            </div>
            <ul className="mt-6 flex-1 space-y-3 text-sm">
              <Bullet>3 Skript-Analysen gesamt</Bullet>
              <Bullet>Alle Plattformen</Bullet>
              <Bullet>Hook-Analyse + 3 Varianten</Bullet>
              <Bullet>Captions + Hashtags</Bullet>
            </ul>
            <Link
              href="/register"
              className="mt-8 rounded-full border border-[var(--color-border)] px-6 py-3 text-center font-semibold transition hover:bg-white/5"
            >
              Kostenlos starten
            </Link>
          </div>

          {/* Creator */}
          <div className="relative flex flex-col rounded-2xl border-2 border-[var(--color-brand)] bg-[var(--color-card)] p-8 shadow-2xl shadow-[var(--color-brand)]/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-brand)] px-3 py-1 text-xs font-bold uppercase tracking-wider text-black">
              Empfohlen
            </div>
            <div>
              <h3 className="text-lg font-bold uppercase tracking-wider text-[var(--color-brand)]">Creator</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-5xl font-black">9 €</span>
                <span className="text-zinc-500">/ Monat</span>
              </div>
              <p className="mt-2 text-sm text-zinc-400">
                Für alle, die regelmäßig Content posten.
              </p>
            </div>
            <ul className="mt-6 flex-1 space-y-3 text-sm">
              <Bullet>25 Skript-Analysen / Monat</Bullet>
              <Bullet>Alles aus „Test"</Bullet>
              <Bullet>Bulk-Modus (20 Links auf einmal)</Bullet>
              <Bullet>Excel- & PDF-Export</Bullet>
              <Bullet>Priority-Verarbeitung</Bullet>
              <Bullet>Jederzeit kündbar</Bullet>
            </ul>
            <Link
              href="/register?plan=creator"
              className="mt-8 rounded-full bg-[var(--color-brand)] px-6 py-3 text-center font-bold text-black transition hover:bg-[var(--color-brand-hover)]"
            >
              Creator-Plan starten
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-[var(--color-brand)] text-xs font-black text-black">
        ✓
      </span>
      <span className="text-zinc-200">{children}</span>
    </li>
  );
}

function FAQ() {
  const faqs = [
    {
      q: "Ist das rechtlich sauber? Ist das nicht Plagiat?",
      a: "Nein. Die KI extrahiert nur das Skript-Gerüst (Hook-Formel, Trigger, Retention-Bogen) – also die Struktur, die viele virale Videos gemeinsam haben. Daraus baut sie dir drei komplett eigene Versionen mit deinen Themen, deiner Sprache, für deine Nische. Was du bekommst, ist 100 % originaler Content – nur mit einer bewährten Struktur darunter. Strukturen sind nicht urheberrechtlich geschützt, Wortlaute schon. Genau deshalb generieren wir neuen Wortlaut.",
    },
    {
      q: "Welche Plattformen werden unterstützt?",
      a: "TikTok, Instagram (Reels), YouTube (Shorts und normale Videos). Facebook ist in Planung.",
    },
    {
      q: "Wie lange dauert eine Analyse?",
      a: "In der Regel 30–90 Sekunden pro Video. Im Bulk-Modus parallel.",
    },
    {
      q: "Kann ich jederzeit kündigen?",
      a: "Ja. Ein Klick im Account. Keine Mindestlaufzeit, keine versteckten Klauseln.",
    },
    {
      q: "Was passiert mit meinen Daten?",
      a: "Deine analysierten Links und generierten Skripte sind nur für dich sichtbar. Wir trainieren keine Modelle damit.",
    },
    {
      q: "Funktioniert das auch für Long-Form-YouTube?",
      a: "Ja, auch längere Videos werden vollständig transkribiert und analysiert. Bei sehr langen Videos dauert es entsprechend länger.",
    },
  ];
  return (
    <section id="faq" className="border-y border-[var(--color-border)] bg-[var(--color-card)] py-24">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="text-balance text-center text-4xl font-black uppercase leading-tight sm:text-5xl">
          Häufige <span className="text-[var(--color-brand)]">Fragen</span>
        </h2>
        <div className="mt-12 space-y-4">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-xl border border-[var(--color-border)] bg-black p-6 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold">
                {f.q}
                <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full border border-[var(--color-border)] text-sm transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-4 text-zinc-400">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <h2 className="text-balance text-4xl font-black uppercase leading-tight sm:text-6xl">
          Hör auf zu raten.
          <br />
          <span className="bg-[var(--color-brand)] px-3 text-black">Fang an zu flippen.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg text-zinc-300">
          3 Analysen kostenlos. Keine Kreditkarte. Ergebnis in 60 Sekunden.
        </p>
        <Link
          href="/register"
          className="mt-10 inline-block rounded-full bg-[var(--color-brand)] px-10 py-4 text-lg font-bold text-black transition hover:bg-[var(--color-brand-hover)]"
        >
          Jetzt kostenlos starten →
        </Link>
      </div>
    </section>
  );
}

