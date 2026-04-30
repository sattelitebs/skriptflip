import type { Metadata } from "next";
import { signUp } from "../actions";
import { AuthShell, AuthInput, AuthSubmit, AuthError, AuthInfo } from "../AuthShell";

export const metadata: Metadata = {
  title: "Registrieren – skriptflip",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; confirm?: string }>;
}) {
  const { error, confirm } = await searchParams;

  if (confirm) {
    return (
      <AuthShell
        title="Fast geschafft"
        subtitle="Wir haben dir eine Bestätigungs-Mail geschickt."
        altText="Schon bestätigt?"
        altLinkLabel="Zur Anmeldung"
        altLinkHref="/login"
      >
        <AuthInfo message="Klick auf den Link in der Mail, um dein Konto zu aktivieren. Schau auch im Spam-Ordner nach." />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Konto erstellen"
      subtitle="3 Skript-Analysen kostenlos. Keine Kreditkarte."
      altText="Schon registriert?"
      altLinkLabel="Anmelden"
      altLinkHref="/login"
    >
      <AuthError message={error} />
      <form action={signUp} className="space-y-5">
        <AuthInput
          label="E-Mail"
          name="email"
          type="email"
          placeholder="du@beispiel.de"
          autoComplete="email"
        />
        <AuthInput
          label="Passwort (min. 8 Zeichen)"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
        />
        <AuthSubmit>Konto erstellen</AuthSubmit>
      </form>
      <p className="mt-5 text-xs text-zinc-500">
        Mit der Registrierung akzeptierst du die{" "}
        <a href="/datenschutz" className="underline hover:text-white">
          Datenschutzerklärung
        </a>
        .
      </p>
    </AuthShell>
  );
}
