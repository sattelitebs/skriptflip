import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Digistore24 IPN-Signatur (SHA-512).
 *
 * Verfahren laut Digistore24:
 *   1. Alle übergebenen Parameter außer `sha_sign` nehmen.
 *   2. Nach Key alphabetisch sortieren (ASCII).
 *   3. Werte mit ":" verbinden (Keys spielen im Hash keine Rolle).
 *   4. Passphrase davorhängen (mit ":" als Trenner).
 *   5. SHA-512 hex-encoden.
 *   6. Mit eingehender `sha_sign` (Hex, lower-case) vergleichen.
 *
 * Hinweis: Im Digistore-Dashboard muss in den Connection-Settings
 * "SHA-passphrase" aktiviert und in env `DIGISTORE_PASSPHRASE` gesetzt sein.
 */
export function computeDigistoreSignature(
  params: Record<string, string>,
  passphrase: string,
): string {
  const sortedKeys = Object.keys(params)
    .filter((k) => k !== "sha_sign")
    .sort();

  const concatenated =
    passphrase + ":" + sortedKeys.map((k) => params[k]).join(":");

  return createHash("sha512").update(concatenated, "utf8").digest("hex");
}

export function verifyDigistoreSignature(
  params: Record<string, string>,
  passphrase: string,
): { ok: boolean; expected: string; received: string | null } {
  const received = (params.sha_sign ?? "").toLowerCase();
  const expected = computeDigistoreSignature(params, passphrase);

  if (!received || received.length !== expected.length) {
    return { ok: false, expected, received: received || null };
  }
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(received, "utf8");
  return { ok: timingSafeEqual(a, b), expected, received };
}
