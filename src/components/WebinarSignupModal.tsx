"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

// Anmelde-Popup: Button öffnet das 4leads-Formular in einem Overlay.
// Wichtig: Das 4leads-Formular ist ein cross-origin <iframe>. Ein iframe
// rendert in vielen Browsern ÜBER absolut positionierten Geschwister-Elementen
// und fängt Klicks ab — deshalb sitzt der Schließen-Button NICHT als Overlay
// auf dem iframe, sondern in einer eigenen Kopfzeile im normalen Flow darüber
// (kann nicht überdeckt werden). Zusätzlich: Schließen per Backdrop, Escape,
// fixiertem Button oben rechts und Link unten.
// Das fl-form-div bleibt dauerhaft im DOM (nur ein-/ausgeblendet), damit das
// 4leads-Loader-Script das Formular beim Laden einmalig findet und füllt.
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

      {/* Overlay – bleibt gemountet, nur ein-/ausgeblendet */}
      <div
        aria-hidden={!open}
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        {/* Abdunkler – Klick schließt */}
        <div
          className="absolute inset-0 bg-black/80"
          onClick={() => setOpen(false)}
        />

        {/* Fest fixierter Schließen-Button oben rechts am Bildschirm —
            liegt über allem (auch über dem iframe) und ist immer erreichbar */}
        {open && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Schließen"
            className="fixed right-4 top-4 z-[70] grid h-11 w-11 place-items-center rounded-full bg-white text-2xl leading-none text-black shadow-lg ring-1 ring-black/10 transition hover:bg-zinc-200"
          >
            ×
          </button>
        )}

        {/* Fenster */}
        <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          {/* Kopfzeile im Flow ÜBER dem iframe — Schließen kann nicht überdeckt werden */}
          <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3">
            <span className="text-sm font-bold uppercase tracking-wide text-zinc-700">
              Platz sichern
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Schließen"
              className="grid h-9 w-9 place-items-center rounded-full bg-black/5 text-2xl leading-none text-zinc-600 transition hover:bg-black/10 hover:text-black"
            >
              ×
            </button>
          </div>

          {/* Scrollbarer Inhalt mit dem 4leads-Formular */}
          <div className="overflow-y-auto p-5">
            <div
              data-height="380"
              className="fl-form"
              data-max-height=""
              data-k="duMG8a"
              data-p="c_VNAwUhp8k4NGyy9X9VKguKMyppNwwZSwzjntMSMZ"
              data-d="https://forms.4leads.net"
            />

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-2 w-full rounded-full border border-zinc-300 py-2 text-sm font-bold uppercase tracking-wide text-zinc-600 transition hover:bg-zinc-100"
            >
              Schließen
            </button>
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
