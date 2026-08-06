// Zentral-Key-Modus für Hookvana-Gratisnutzer.
// Gratisnutzer bringen KEINE eigenen Keys (kein BYOK) — der öffentliche
// Hook-Umbau läuft über EINEN server-seitigen Key (Torstens Anthropic-Key).
// Bevorzugt ein dediziertes HOOKVANA_ANTHROPIC_KEY (für saubere Kostentrennung),
// fällt sonst auf den bestehenden zentralen ANTHROPIC_API_KEY zurück.
export function getCentralAnthropicKey(): string {
  const key = process.env.HOOKVANA_ANTHROPIC_KEY ?? process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error(
      "Kein zentraler Anthropic-Key gesetzt. Setze HOOKVANA_ANTHROPIC_KEY (oder ANTHROPIC_API_KEY).",
    );
  }
  return key;
}

export function hasCentralAnthropicKey(): boolean {
  return Boolean(process.env.HOOKVANA_ANTHROPIC_KEY ?? process.env.ANTHROPIC_API_KEY);
}
