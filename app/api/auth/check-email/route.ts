import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logAuthEvent } from "@/lib/authLog";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Asks the database one narrow question (may this email sign in?) through the
// check_participant_login function, instead of reading the participants table.
export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email) {
    await logAuthEvent("check-email:missing", request);
    return NextResponse.json({ allowed: false }, { status: 400 });
  }

  const normalised = String(email).toLowerCase().trim();

  const { data: status, error } = await supabase.rpc("check_participant_login", {
    p_email: normalised,
  });

  if (error) {
    await logAuthEvent("check-email:error", request, { error: error.message }, normalised);
    return NextResponse.json({ allowed: false, error: "check-failed" }, { status: 500 });
  }

  if (status === "allowed" || status === "needs_terms") {
    const needsTerms = status === "needs_terms";
    await logAuthEvent("check-email:allowed", request, { needsTerms }, normalised);
    return NextResponse.json({ allowed: true, needsTerms });
  }

  // 'not_found', 'revoked' or 'expired'
  const reason = status === "revoked" || status === "expired" ? status : "not-found";
  await logAuthEvent(`check-email:${reason}`, request, {}, normalised);
  return NextResponse.json({ allowed: false });
}
