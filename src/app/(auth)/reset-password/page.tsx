import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updatePassword } from "../actions";
import { AuthShell, AuthInput, AuthSubmit, AuthError } from "../AuthShell";

export const metadata: Metadata = {
  title: "Neues Passwort setzen – skriptflip",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  // User muss eine Recovery-Session haben (kommt über /auth/confirm rein).
  // Ohne Session → zurück zu „Passwort vergessen".
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(
      "/forgot-password?error=" +
        encodeURIComponent("Reset-Link ungültig oder abgelaufen. Bitte neu anfordern."),
    );
  }

  return (
    <AuthShell
      title="Neues Passwort"
      subtitle="Wähl ein neues Passwort — mindestens 8 Zeichen."
      altText="Anmelden geht doch?"
      altLinkLabel="Zur Anmeldung"
      altLinkHref="/login"
    >
      <AuthError message={error} />
      <form action={updatePassword} className="space-y-5">
        <AuthInput
          label="Neues Passwort"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
        />
        <AuthInput
          label="Passwort bestätigen"
          name="confirm"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
        />
        <AuthSubmit>Passwort speichern</AuthSubmit>
      </form>
    </AuthShell>
  );
}
