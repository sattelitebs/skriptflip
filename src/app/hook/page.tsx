import type { Metadata } from "next";
import { HookTool } from "./HookTool";

export const metadata: Metadata = {
  title: "Hook-Check – ist dein Hook stark genug? | skriptflip",
  description:
    "Kostenloser Hook-Check: Ampel + Score in Sekunden, plus 3 stärkere Varianten per KI. Nach den echten Regeln für viralen Content, der verkauft.",
};

export default function HookPage() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(254,220,49,0.16),transparent_60%)]"
      />
      <div className="mx-auto max-w-3xl px-6 pt-16 pb-24 sm:pt-20">
        <div className="text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-[var(--color-brand)]">
            <span className="h-2 w-2 rounded-full bg-[var(--color-brand)]" />
            Gratis Hook-Check
          </div>
          <h1 className="text-balance text-4xl font-black uppercase leading-[1.05] tracking-tight sm:text-5xl">
            Ist dein Hook <span className="bg-[var(--color-brand)] px-3 text-black">stark genug?</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-lg text-zinc-300">
            Der Hook entscheidet, ob jemand weiterschaut oder wegwischt. Wirf deinen Hook rein —
            du siehst sofort, wo er hakt. Und holst dir 3 stärkere Varianten.
          </p>
        </div>

        <HookTool />
      </div>
    </section>
  );
}
