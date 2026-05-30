"use client";

import Script from "next/script";

// 4leads-Anmeldeformular, DIREKT in die Seite eingebettet (kein Popup).
// Das fl-form-div wird vom 4leads-Loader-Script beim Laden gefunden und mit
// dem cross-origin <iframe> gefuellt. Bewusst inline statt Popup: der Embed-
// iframe rendert nicht zuverlaessig, wenn er beim Laden in einem versteckten
// Overlay sitzt (Popup oeffnete leer). Inline ist sichtbar -> rendert sicher.
export default function WebinarSignupForm() {
  return (
    <div className="mx-auto mt-8 w-full max-w-lg overflow-hidden rounded-2xl bg-white p-5 text-left shadow-2xl">
      <div
        data-height="380"
        className="fl-form"
        data-max-height=""
        data-k="duMG8a"
        data-p="c_VNAwUhp8k4NGyy9X9VKguKMyppNwwZSwzjntMSMZ"
        data-d="https://forms.4leads.net"
      />
      <Script
        src="https://static.4leads.net/assets/bundle/flForms.js?v=6.15.6"
        strategy="afterInteractive"
      />
    </div>
  );
}
