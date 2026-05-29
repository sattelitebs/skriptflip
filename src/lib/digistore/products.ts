/**
 * Zuordnung Digistore-Produkt → Lizenz-Typ.
 *
 * Pflege die echten Produkt-IDs als kommaseparierte Env-Variablen:
 *   DIGISTORE_LIFETIME_PRODUCT_IDS="123456,123457"   (Earlybird 197 € + Lifetime 297 €)
 *   DIGISTORE_YEARLY_PRODUCT_IDS="123458"            (Jahresabo 97 €)
 *
 * Die explizite Zuordnung gewinnt. Ist eine Produkt-ID nicht gelistet, fällt die
 * Logik auf Digistores `billing_type` zurück (subscription → yearly, sonst lifetime),
 * sodass auch ohne gepflegte Env nichts kaputtgeht.
 */
export type LicenseType = "lifetime" | "yearly";

function idSet(envValue: string | undefined): Set<string> {
  return new Set(
    (envValue ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

export function licenseTypeFor(
  productId: string | null | undefined,
  billingType: string | null | undefined,
): LicenseType {
  const lifetimeIds = idSet(process.env.DIGISTORE_LIFETIME_PRODUCT_IDS);
  const yearlyIds = idSet(process.env.DIGISTORE_YEARLY_PRODUCT_IDS);

  if (productId) {
    if (lifetimeIds.has(productId)) return "lifetime";
    if (yearlyIds.has(productId)) return "yearly";
  }

  // Fallback: Digistore-Abrechnungsart
  return billingType === "subscription" ? "yearly" : "lifetime";
}
