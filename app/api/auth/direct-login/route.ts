import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SignJWT } from "jose";

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
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const normalised = email.toLowerCase().trim();

  // Check allowlist
  const { data, error } = await supabase
    .from("participants")
    .select("email, status, expires_at, accepted_terms_at, name")
    .ilike("email", normalised)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "not_found" }, { status: 403 });
  }

  if (data.status === "revoked") {
    return NextResponse.json({ error: "revoked" }, { status: 403 });
  }

  if (new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: "expired" }, { status: 403 });
  }

  // Check if terms needed
  if (!data.accepted_terms_at) {
    return NextResponse.json({ needsTerms: true });
  }

  // Create a signed JWT session token
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
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });

  return response;
}
