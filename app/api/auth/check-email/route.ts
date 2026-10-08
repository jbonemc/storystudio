import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logAuthEvent } from "@/lib/authLog";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email) {
    await logAuthEvent("check-email:missing", request);
    return NextResponse.json({ allowed: false }, { status: 400 });
  }

  const normalised = email.toLowerCase().trim();

  const { data, error } = await supabase
    .from("participants")
    .select("email, status, expires_at, accepted_terms_at")
    .eq("email", normalised)
    .single();

  if (error || !data) {
    await logAuthEvent("check-email:not-found", request, {}, normalised);
    return NextResponse.json({ allowed: false });
  }

  if (data.status === "revoked") {
    await logAuthEvent("check-email:revoked", request, {}, normalised);
    return NextResponse.json({ allowed: false });
  }

  if (new Date(data.expires_at) < new Date()) {
    await logAuthEvent("check-email:expired", request, { expires_at: data.expires_at }, normalised);
    return NextResponse.json({ allowed: false });
  }

  const needsTerms = !data.accepted_terms_at;
  await logAuthEvent("check-email:allowed", request, { needsTerms }, normalised);

  return NextResponse.json({ allowed: true, needsTerms });
}
