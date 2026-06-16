"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=" + encodeURIComponent("Bitte E-Mail und Passwort eingeben."));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login?error=" + encodeURIComponent("E-Mail oder Passwort falsch."));
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || password.length < 8) {
    redirect("/register?error=" + encodeURIComponent("Bitte E-Mail und ein Passwort mit mindestens 8 Zeichen angeben."));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/confirm`,
    },
  });

  if (error) {
    redirect("/register?error=" + encodeURIComponent(error.message));
  }

  redirect("/register?confirm=1");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    redirect("/forgot-password?error=" + encodeURIComponent("Bitte E-Mail eingeben."));
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/confirm?next=/reset-password`,
  });

  // Bewusst kein Detail-Error preisgeben (Account-Enumeration-Schutz):
  // wir zeigen IMMER „Mail unterwegs", auch wenn die Adresse unbekannt ist.
  if (error) {
    console.error("[auth] resetPasswordForEmail:", error.message);
  }
  redirect("/forgot-password?sent=1");
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    redirect(
      "/reset-password?error=" +
        encodeURIComponent("Passwort muss mindestens 8 Zeichen haben."),
    );
  }
  if (password !== confirm) {
    redirect(
      "/reset-password?error=" + encodeURIComponent("Die Passwörter stimmen nicht überein."),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect("/reset-password?error=" + encodeURIComponent(error.message));
  }

  // Nach Update ausloggen, damit User sich frisch mit neuem Passwort einloggt.
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login?info=" + encodeURIComponent("Passwort geändert. Bitte neu anmelden."));
}
