import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/admin/import-participants
 * Body: { participants: [{ email, name?, cohort?, organisation? }], cohort?, organisation?, months? }
 *
 * Accepts either:
 * 1. JSON body with participants array
 * 2. CSV text in body with "csv" content type (columns: email, name, cohort, organisation)
 */
export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";

  let rows: {
    email: string;
    name?: string;
    cohort?: string;
    organisation?: string;
  }[] = [];
  let defaultCohort = "default";
  let defaultOrganisation = "";
  let months = 12;

  if (contentType.includes("text/csv")) {
    // Parse CSV
    const text = await request.text();
    const lines = text.trim().split("\n");
    const headers = lines[0].toLowerCase().split(",").map((h) => h.trim());

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || "";
      });
      if (row.email) {
        rows.push({
          email: row.email.toLowerCase(),
          name: row.name || undefined,
          cohort: row.cohort || undefined,
          organisation: row.organisation || undefined,
        });
      }
    }
  } else {
    // Parse JSON
    const body = await request.json();
    rows = body.participants || [];
    defaultCohort = body.cohort || "default";
    defaultOrganisation = body.organisation || "";
    months = body.months || 12;
  }

  if (!rows.length) {
    return NextResponse.json({ error: "No participants provided" }, { status: 400 });
  }

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + months);

  const toInsert = rows.map((r) => ({
    email: r.email.toLowerCase().trim(),
    name: r.name || null,
    cohort: r.cohort || defaultCohort,
    organisation: r.organisation || defaultOrganisation || null,
    expires_at: expiresAt.toISOString(),
  }));

  const { data, error } = await supabase
    .from("participants")
    .upsert(toInsert, { onConflict: "email", ignoreDuplicates: false })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    imported: data?.length || 0,
    cohort: defaultCohort,
    expires_at: expiresAt.toISOString(),
  });
}
