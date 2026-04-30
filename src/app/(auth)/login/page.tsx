import type { Metadata } from "next";
import { signIn } from "../actions";
import { AuthShell, AuthInput, AuthSubmit, AuthError } from "../AuthShell";

export const metadata: Metadata = {
  title: "Anmelden – skriptflip",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <AuthShell
      title="Willkommen zurück"
      subtitle="Melde dich an, um auf dein Dashboard zu kommen."
      altText="Noch kein Konto?"
      altLinkLabel="Kostenlos registrieren"
      altLinkHref="/register"
    >
      <AuthError message={error} />
      <form action={signIn} className="space-y-5">
        <AuthInput
          label="E-Mail"
          name="email"
          type="email"
          placeholder="du@beispiel.de"
          autoComplete="email"
        />
        <AuthInput
          label="Passwort"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
        />
        <AuthSubmit>Anmelden</AuthSubmit>
      </form>
    </AuthShell>
  );
}
