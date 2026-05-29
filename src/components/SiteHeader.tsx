import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-black/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-[var(--color-brand)] text-black font-black">
            S
          </span>
          <span className="text-lg tracking-tight">skriptflip</span>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="hidden text-sm text-zinc-300 hover:text-white sm:block"
              >
                Dashboard
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/5"
                >
                  Abmelden
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/5"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
