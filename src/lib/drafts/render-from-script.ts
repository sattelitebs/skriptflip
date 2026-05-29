/**
 * Rendert ein generiertes Skript als Markdown-Draft — für Copy/Export aus der UI.
 */
export type ScriptDraft = {
  title: string;
  script: string;
};

export function renderDraftFromScript(script: ScriptDraft): string {
  const title = script.title?.trim() || "Skript";
  const body = script.script?.trim() || "";
  return `## ${title}\n\n${body}\n`;
}

/**
 * Rendert mehrere Skripte zu einem zusammenhängenden Markdown-Dokument.
 */
export function renderDraftsFromScripts(scripts: ScriptDraft[]): string {
  return scripts.map(renderDraftFromScript).join("\n---\n\n");
}
