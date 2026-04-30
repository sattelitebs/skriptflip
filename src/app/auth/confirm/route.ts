import { type NextRequest, NextResponse } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  console.log("[auth/confirm] incoming params:", {
    token_hash: token_hash ? `${token_hash.slice(0, 12)}...` : null,
    type,
    code: code ? `${code.slice(0, 12)}...` : null,
    next,
    fullUrl: request.url,
  });

  const supabase = await createClient();

  // Modern OTP flow (token_hash + type)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      console.log("[auth/confirm] OTP verify OK, redirecting to", next);
      return NextResponse.redirect(new URL(next, origin));
    }
    console.error("[auth/confirm] OTP verify error:", error.message);
    return NextResponse.redirect(
      new URL(
        "/login?error=" +
          encodeURIComponent(`Bestätigung fehlgeschlagen: ${error.message}`),
        origin,
      ),
    );
  }

  // PKCE flow (code)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      console.log("[auth/confirm] PKCE exchange OK, redirecting to", next);
      return NextResponse.redirect(new URL(next, origin));
    }
    console.error("[auth/confirm] PKCE exchange error:", error.message);
    return NextResponse.redirect(
      new URL(
        "/login?error=" +
          encodeURIComponent(`Bestätigung fehlgeschlagen: ${error.message}`),
        origin,
      ),
    );
  }

  console.error("[auth/confirm] missing both token_hash/type and code");
  return NextResponse.redirect(
    new URL(
      "/login?error=" +
        encodeURIComponent(
          "Bestätigungslink unvollständig — Email-Template prüfen.",
        ),
      origin,
    ),
  );
}
