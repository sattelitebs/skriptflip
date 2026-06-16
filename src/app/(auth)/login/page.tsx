import type { Metadata } from "next";
import Link from "next/link";
import { signIn } from "../actions";
import { AuthShell, AuthInput, AuthSubmit, AuthError, AuthInfo } from "../AuthShell";

export const metadata: Metadata = {
  title: "Anmelden – skriptflip",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; info?: string }>;
}) {
  const { error, info } = await searchParams;

  return (
    <AuthShell
      title="Willkommen zurück"
      subtitle="Melde dich an, um auf dein Dashboard zu kommen."
      altText="Noch kein Konto?"
      altLinkLabel="Kostenlos registrieren"
      altLinkHref="/register"
    >
      <AuthError message={error} />
      <AuthInfo message={info} />
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
      <p className="mt-4 text-center text-sm">
        <Link
          href="/forgot-password"
          className="text-zinc-400 hover:text-[var(--color-brand)]"
        >
          Passwort vergessen?
        </Link>
      </p>
    </AuthShell>
  );
}
