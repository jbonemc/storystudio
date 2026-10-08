import { createServerClient } from "@supabase/ssr";
import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SECRET = new TextEncoder().encode(
  process.env.PORTAL_SESSION_SECRET || "storystudio-fallback-secret-change-me"
);

const logDb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function logMiddleware(event: string, request: NextRequest, details: Record<string, unknown> = {}) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  try {
    await logDb.from("auth_logs").insert({
      event,
      ip,
      user_agent: request.headers.get("user-agent") || "unknown",
      details: { path: request.nextUrl.pathname, ...details },
    });
  } catch {}
}

async function checkPortalSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get("portal-session")?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Allow access to login, auth callback, and public assets
  const isPublicRoute =
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname.startsWith("/auth/") ||
    request.nextUrl.pathname.startsWith("/_next/") ||
    request.nextUrl.pathname.startsWith("/api/") ||
    request.nextUrl.pathname === "/favicon.ico";

  if (isPublicRoute) return supabaseResponse;

  // Check portal session cookie first (bypasses Supabase auth / SMTP)
  const hasPortalSession = await checkPortalSession(request);
  if (hasPortalSession) {
    // If on /login with a valid session, redirect to home
    if (request.nextUrl.pathname === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Fall back to Supabase auth (magic link flow)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    await logMiddleware("middleware:no-session", request, {
      hasPortalCookie: !!request.cookies.get("portal-session"),
      supabaseCookies: request.cookies.getAll().map(c => c.name).filter(n => n.startsWith("sb-")),
    });
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // If logged in and hitting /login, redirect to home
  if (user && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
