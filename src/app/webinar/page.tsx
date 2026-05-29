import type { Metadata } from "next";
import WebinarSignupForm from "./WebinarSignupForm";

export const metadata: Metadata = {
  title: "Kostenloses Live-Webinar – viraler Content, der verkauft | skriptflip",
  description:
    "Wie du in einer Stunde viralen Content erstellst, der wirklich verkauft. Kostenloses Live-Webinar – das System aus 3 Hebeln plus Tool-Reveal am Ende.",
};

// Eckdaten zentral – hier den echten Termin pflegen.
const WEBINAR = {
  badge: "Kostenloses Live-Webinar · 2. Juni · 19:00 Uhr",
  date: "2. Juni 2026",
  time: "19:00 Uhr",
  place: "Live auf Zoom",
};

// Persona hinter dem Webinar – Name hier anpassen.
const FOUNDER = "Torsten";

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
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-[var(--color-brand)]">
            <span className="h-2 w-2 rounded-full bg-[var(--color-brand)]" />
            {WEBINAR.badge}
          </div>

          <h1 className="text-balance text-4xl font-black uppercase leading-[1.05] tracking-tight sm:text-5xl">
            Wie du in einer Stunde viralen Content erstellst,
            <br />
            <span className="bg-[var(--color-brand)] px-3 text-black">der wirklich verkauft.</span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-pretty text-lg text-zinc-300">
            Ohne Bauchgefühl-Posten, ohne stundenlanges Hin- und Herschreiben — und ohne hinter
            Trends herzulaufen, von denen am Ende kein einziger Kunde bei dir kauft.
          </p>

          <a
            href="#anmelden"
            className="mt-10 inline-block rounded-full bg-[var(--color-brand)] px-10 py-4 text-base font-bold text-black transition hover:bg-[var(--color-brand-hover)]"
          >
            Jetzt kostenlos Platz sichern →
          </a>
        </div>
      </section>

      {/* Quote-Band */}
      <section className="border-y border-[var(--color-border)] bg-[var(--color-card)] py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="text-balance text-2xl font-bold leading-snug sm:text-3xl">
            „Der Unterschied zwischen Content, der viral geht, und Content, der{" "}
            <span className="text-[var(--color-brand)]">verkauft</span>, ist kein Zufall — es ist
            ein System."
          </p>
          <p className="mt-6 text-sm uppercase tracking-widest text-zinc-500">— {FOUNDER}</p>
        </div>
      </section>

      {/* Was du im Webinar lernst — die 3 Hebel */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <p className="text-center text-sm font-bold uppercase tracking-widest text-zinc-500">
            Was du im Webinar lernst
          </p>
          <h2 className="mt-4 text-center text-3xl font-black uppercase leading-tight sm:text-4xl">
            Die drei Hebel hinter <span className="text-[var(--color-brand)]">viralem Content, der verkauft</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-zinc-400">
            Ich zeige dir das System, mit dem ich Content erstelle, der nicht nur Reichweite
            bringt, sondern auch Käufer — und am Ende stelle ich dir das Tool vor, das ich mir
            genau dafür gebaut habe.
          </p>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <Lever
              n="1"
              title="Radar"
              desc="Wie du erkennst, welche Themen in deiner Nische gerade wirklich ziehen — und welche nur laut sind, aber keinen Umsatz machen."
            />
            <Lever
              n="2"
              title="Hook"
              desc="Die Hook-Struktur, die in den ersten drei Sekunden entscheidet, ob jemand weiterscrollt oder bei dir hängen bleibt — und später bei dir kauft."
            />
            <Lever
              n="3"
              title="Verkauf"
              desc="Wie du im Content selbst schon verkaufst, ohne dass es sich nach Werbung anfühlt — und warum genau das den Unterschied zwischen viral und verkauft macht."
            />
          </div>
        </div>
      </section>

      {/* Was dich erwartet — Stats */}
      <section className="border-y border-[var(--color-border)] bg-[var(--color-card)] py-20">
        <div className="mx-auto max-w-4xl px-6">
          <p className="text-center text-sm font-bold uppercase tracking-widest text-zinc-500">
            Was dich erwartet
          </p>
          <h2 className="mx-auto mt-4 max-w-3xl text-center text-3xl font-black uppercase leading-tight sm:text-4xl">
            Kein Theorie-Vortrag. Ich zeige dir mein{" "}
            <span className="text-[var(--color-brand)]">Content-System</span> — und das Tool dahinter.
          </h2>

          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            <Stat n="3" label="Hebel, die viralen Content erst verkaufsstark machen" />
            <Stat n="60" label="Minuten, in denen du dein Content-Marketing neu denkst" />
            <Stat n="1" label="Tool-Reveal: das System, das ich mir selbst dafür gebaut habe" />
          </div>
        </div>
      </section>

      {/* Wer dich begleitet */}
      <section className="py-20">
        <div className="mx-auto grid max-w-4xl gap-10 px-6 md:grid-cols-2 md:items-center">
          <div className="aspect-[4/5] rounded-2xl border border-[var(--color-border)] bg-[radial-gradient(ellipse_at_center,rgba(254,220,49,0.12),var(--color-card))]" />
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">
              Wer dich begleitet
            </p>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-tight sm:text-4xl">
              Hey, ich bin <span className="text-[var(--color-brand)]">{FOUNDER}</span>.
            </h2>
            <div className="mt-5 space-y-4 text-zinc-300">
              <p>
                Ich helfe Creatorn, Coaches und Selbstständigen, mit Kurzvideos ein Business
                aufzubauen, das mit ihnen wächst — und Content ist dabei der eine Hebel, der alles
                andere erst möglich macht.
              </p>
              <p>
                Über die Jahre habe ich gemerkt: Das, was wirklich verkauft, ist kein Glück, sondern
                ein <strong className="text-white">wiederholbares System</strong>.{" "}
                <strong className="text-white">skriptflip ist die Maschine, die ich mir dafür gebaut habe.</strong>
              </p>
              <p>
                Am {WEBINAR.date} zeige ich dir das ganze System live — damit du nicht mehr raten
                musst, was funktioniert, sondern weißt, warum.
              </p>
            </div>
            <a
              href="#anmelden"
              className="mt-8 inline-block rounded-full bg-[var(--color-brand)] px-8 py-3 text-sm font-bold uppercase tracking-wide text-black transition hover:bg-[var(--color-brand-hover)]"
            >
              Ich bin dabei →
            </a>
          </div>
        </div>
      </section>

      {/* Anmeldung */}
      <section id="anmelden" className="border-t border-[var(--color-border)] bg-[var(--color-card)] py-20">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-balance text-3xl font-black uppercase leading-tight sm:text-4xl">
            Sei dabei am <span className="text-[var(--color-brand)]">{WEBINAR.date.replace(" 2026", "")} um {WEBINAR.time.replace(" Uhr", "")} Uhr</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-zinc-400">
            Eine Stunde, die deinen Blick auf Content komplett verändert. Kostenfrei. Mit dem
            kompletten Tool-Reveal am Ende.
          </p>

          <div className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-zinc-300">
            <Chip>{WEBINAR.date}</Chip>
            <Chip>{WEBINAR.time}</Chip>
            <Chip>{WEBINAR.place}</Chip>
          </div>

          <div className="mx-auto mt-8 max-w-md text-left">
            <WebinarSignupForm />
          </div>
        </div>
      </section>
    </>
  );
}

function Lever({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--color-brand)] text-lg font-black text-black">
        {n}
      </div>
      <h3 className="mt-5 text-2xl font-black uppercase tracking-tight">{title}</h3>
      <p className="mt-3 text-sm text-zinc-400">{desc}</p>
    </div>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-6xl font-black text-[var(--color-brand)]">{n}</div>
      <p className="mx-auto mt-2 max-w-[12rem] text-sm text-zinc-400">{label}</p>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-[var(--color-border)] bg-black px-4 py-2 font-semibold">
      {children}
    </span>
  );
}
