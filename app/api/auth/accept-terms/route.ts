import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAuthEvent } from "@/lib/authLog";

// Records the fair use agreement for the signed-in participant. The login page
// calls this straight after the emailed code is accepted, so the record is
// tied to a verified email rather than to whatever address someone typed.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    await logAuthEvent("accept-terms:not-signed-in", request);
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const email = user.email.toLowerCase().trim();
  const { data: updated, error } = await supabase.rpc("accept_my_terms");

  if (error || !updated) {
    await logAuthEvent(
      "accept-terms:error",
      request,
      { error: error?.message || "no matching participant" },
      email
    );
    return NextResponse.json({ success: false }, { status: 500 });
  }

  await logAuthEvent("accept-terms:success", request, {}, email);
  return NextResponse.json({ success: true });
}
