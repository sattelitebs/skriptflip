import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  // app.skriptflip.com ist die Software: Wurzel direkt ins Dashboard
  // (das selbst auf /login umleitet, falls nicht eingeloggt). Die Marketing-
  // Startseite (Webinar-Einladung) lebt auf der Apex-Domain skriptflip.com.
  const host = request.headers.get("host") ?? "";
  if (host.startsWith("app.") && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon, images, fonts
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
