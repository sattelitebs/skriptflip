"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

// Anmelde-Popup: Button öffnet das 4leads-Formular in einem Overlay mit
// Schließen-X. Das fl-form-div bleibt dauerhaft im DOM (nur per visibility
// versteckt), damit das 4leads-Loader-Script das Formular zuverlässig rendert —
// es scannt beim Laden einmalig nach `.fl-form` und füllt den iframe.
export default function WebinarSignupModal() {
  const [open, setOpen] = useState(false);

  // Escape schließt das Popup
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Hintergrund-Scroll sperren, solange das Popup offen ist
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-8 inline-block rounded-full bg-[var(--color-brand)] px-10 py-4 text-base font-bold uppercase tracking-wide text-black transition hover:bg-[var(--color-brand-hover)]"
      >
        Jetzt kostenfrei Platz sichern →
      </button>

      {/* Overlay – bleibt gemountet, nur per visibility/opacity ein-/ausgeblendet */}
      <div
        aria-hidden={!open}
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        {/* Abdunkler */}
        <div
          className="absolute inset-0 bg-black/80"
          onClick={() => setOpen(false)}
        />

        {/* Fenster */}
        <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Schließen"
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/5 text-2xl leading-none text-zinc-500 transition hover:bg-black/10 hover:text-black"
          >
            ×
          </button>

          <div className="mt-6">
            <div
              data-height="380"
              className="fl-form"
              data-max-height=""
              data-k="duMG8a"
              data-p="c_VNAwUhp8k4NGyy9X9VKguKMyppNwwZSwzjntMSMZ"
              data-d="https://forms.4leads.net"
            />
          </div>
        </div>
      </div>

      <Script
        src="https://static.4leads.net/assets/bundle/flForms.js?v=6.15.6"
        strategy="afterInteractive"
      />
    </>
  );
}
