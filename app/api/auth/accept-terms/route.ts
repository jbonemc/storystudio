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
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const normalised = email.toLowerCase().trim();

  const { error } = await supabase
    .from("participants")
    .update({ accepted_terms_at: new Date().toISOString() })
    .eq("email", normalised);

  if (error) {
    await logAuthEvent("accept-terms:error", request, { error: error.message }, normalised);
    return NextResponse.json({ success: false }, { status: 500 });
  }

  await logAuthEvent("accept-terms:success", request, {}, normalised);
  return NextResponse.json({ success: true });
}
