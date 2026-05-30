import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Du bist dabei – Anmeldung bestätigt | skriptflip",
  description:
    "Deine Anmeldung zum kostenlosen Live-Workshop ist bestätigt. Zugangslink und Termin bekommst du per Mail.",
  robots: { index: false, follow: false },
};

export default function Danke() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(254,220,49,0.18),transparent_60%)]"
      />
      <div className="mx-auto max-w-2xl px-6 pt-20 pb-24 text-center sm:pt-28">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-[var(--color-brand)]">
          <span className="h-2 w-2 rounded-full bg-[var(--color-brand)]" />
          Anmeldung bestätigt
        </div>

        <h1 className="text-balance text-4xl font-black uppercase leading-[1.05] tracking-tight sm:text-5xl">
          Du bist <span className="bg-[var(--color-brand)] px-3 text-black">dabei.</span>
        </h1>

        <p className="mx-auto mt-8 max-w-xl text-pretty text-lg text-zinc-300">
          Deinen Platz im Workshop habe ich reserviert. Den genauen Termin und deinen persönlichen
          Zugangslink bekommst du gleich per Mail — schau am besten direkt rein.
        </p>

        <div className="mx-auto mt-12 max-w-md text-left">
          <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">
            Deine nächsten Schritte
          </p>
          <ol className="mt-5 space-y-3">
            <Step n="1">
              Öffne jetzt dein Postfach. Falls nichts da ist, schau im Spam- oder Werbung-Ordner — und
              zieh die Mail ins Hauptpostfach, damit du auch die Erinnerungen sicher bekommst.
            </Step>
            <Step n="2">
              Trag dir den Termin direkt in den Kalender ein. Der Link zum Live-Raum steht in der Mail.
            </Step>
            <Step n="3">
              Sei pünktlich dabei. Das Wichtige kommt mittendrin — und ein Replay kann ich dir nicht
              versprechen.
            </Step>
          </ol>
        </div>

        <p className="mx-auto mt-12 max-w-xl text-pretty text-zinc-400">
          Wir sehen uns im Workshop. Wir gehen das komplette System zusammen durch — Radar, Hook,
          Verkauf — und am Ende das Tool, das ich mir genau dafür gebaut habe.
        </p>
        <p className="mt-6 text-sm uppercase tracking-widest text-zinc-500">— Torsten</p>
      </div>
    </section>
  );
}

function Step({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-4">
      <span className="mt-0.5 grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-[var(--color-brand)] text-xs font-black text-black">
        {n}
      </span>
      <span className="text-zinc-200">{children}</span>
    </li>
  );
}
