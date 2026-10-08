import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SignJWT } from "jose";
import { logAuthEvent } from "@/lib/authLog";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SECRET = new TextEncoder().encode(
  process.env.PORTAL_SESSION_SECRET || "storystudio-fallback-secret-change-me"
);

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email) {
    await logAuthEvent("direct-login:missing-email", request);
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const normalised = email.toLowerCase().trim();

  const { data, error } = await supabase
    .from("participants")
    .select("email, status, expires_at, accepted_terms_at, name")
    .ilike("email", normalised)
    .single();

  if (error || !data) {
    await logAuthEvent("direct-login:not-found", request, {}, normalised);
    return NextResponse.json({ error: "not_found" }, { status: 403 });
  }

  if (data.status === "revoked") {
    await logAuthEvent("direct-login:revoked", request, {}, normalised);
    return NextResponse.json({ error: "revoked" }, { status: 403 });
  }

  if (new Date(data.expires_at) < new Date()) {
    await logAuthEvent("direct-login:expired", request, { expires_at: data.expires_at }, normalised);
    return NextResponse.json({ error: "expired" }, { status: 403 });
  }

  if (!data.accepted_terms_at) {
    await logAuthEvent("direct-login:needs-terms", request, {}, normalised);
    return NextResponse.json({ needsTerms: true });
  }

  const token = await new SignJWT({
    email: data.email,
    name: data.name || null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);

  const response = NextResponse.json({ success: true });
  response.cookies.set("portal-session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  await logAuthEvent("direct-login:success", request, {}, normalised);
  return response;
}
