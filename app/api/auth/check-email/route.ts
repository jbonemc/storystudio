import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ allowed: false }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("participants")
    .select("email, status, expires_at, accepted_terms_at")
    .eq("email", email.toLowerCase().trim())
    .single();

  if (error || !data) {
    return NextResponse.json({ allowed: false });
  }

  // Check status
  if (data.status === "revoked") {
    return NextResponse.json({ allowed: false });
  }

  // Check expiry
  if (new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ allowed: false });
  }

  // Check if they need to accept terms
  const needsTerms = !data.accepted_terms_at;

  return NextResponse.json({ allowed: true, needsTerms });
}
