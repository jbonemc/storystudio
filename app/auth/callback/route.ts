import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { logAuthEvent } from "@/lib/authLog";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Supabase redirects here with error params when verify fails
  if (errorParam) {
    await logAuthEvent("callback:supabase-error", request, {
      error: errorParam,
      error_description: errorDescription,
    });
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  if (!code) {
    await logAuthEvent("callback:no-code", request, {
      params: Object.fromEntries(searchParams.entries()),
    });
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  await logAuthEvent("callback:code-received", request, { codePrefix: code.substring(0, 8) });

  const cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];

  // Log what cookies we have (names only, not values)
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieNames = cookieHeader
    .split("; ")
    .filter(Boolean)
    .map((c) => c.split("=")[0]);

  await logAuthEvent("callback:cookies-present", request, { cookieNames });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieHeader.split("; ").filter(Boolean).map((c) => {
            const [name, ...rest] = c.split("=");
            return { name, value: rest.join("=") };
          });
        },
        setAll(cookies) {
          cookiesToSet.push(...cookies);
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (!error) {
    await logAuthEvent("callback:session-created", request, {
      cookiesSet: cookiesToSet.map((c) => c.name),
    });
    const response = NextResponse.redirect(`${origin}${next}`);
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });
    return response;
  }

  await logAuthEvent("callback:exchange-failed", request, {
    error: error.message,
    code: error.status,
  });

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
