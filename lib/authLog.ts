import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function logAuthEvent(
  event: string,
  request: Request,
  details: Record<string, unknown> = {},
  email?: string
) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  try {
    await supabase.from("auth_logs").insert({
      event,
      email: email?.toLowerCase().trim() || null,
      ip,
      user_agent: userAgent,
      details,
    });
  } catch (e) {
    console.error("Failed to write auth log:", e);
  }
}
