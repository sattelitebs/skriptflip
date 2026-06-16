import type { Metadata } from "next";
import { requestPasswordReset } from "../actions";
import { AuthShell, AuthInput, AuthSubmit, AuthError, AuthInfo } from "../AuthShell";

export const metadata: Metadata = {
  title: "Passwort vergessen – skriptflip",
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;

  return (
    <AuthShell
      title="Passwort vergessen"
      subtitle="Gib deine E-Mail ein — wir schicken dir einen Link zum Zurücksetzen."
      altText="Doch wieder eingefallen?"
      altLinkLabel="Zur Anmeldung"
      altLinkHref="/login"
    >
      <AuthError message={error} />
      {sent && (
        <AuthInfo message="Wir haben dir einen Link geschickt — falls die Adresse bei uns hinterlegt ist. Schau in dein Postfach (auch Spam)." />
      )}
      <form action={requestPasswordReset} className="space-y-5">
        <AuthInput
          label="E-Mail"
          name="email"
          type="email"
          placeholder="du@beispiel.de"
          autoComplete="email"
        />
        <AuthSubmit>Link anfordern</AuthSubmit>
      </form>
    </AuthShell>
  );
}
