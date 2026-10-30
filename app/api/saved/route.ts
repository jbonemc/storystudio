import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Saved work for the Story Bank and Content Tool autosave.
// Uses the participant's own Supabase session, so the table's row-level
// security means each person can only ever see and change their own rows.

const NOT_SET_UP =
  "Saving is not switched on yet. Copy anything you want to keep before leaving this page.";

function tableMissing(error: { code?: string; message?: string } | null) {
  return !!error && (error.code === "42P01" || error.code === "PGRST205" || /saved_work/.test(error.message || ""));
}

async function session() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, email: user?.email };
}

const unauthorised = () =>
  NextResponse.json({ error: "Your session has ended. Please sign in again to save your work." }, { status: 401 });

export async function GET(req: NextRequest) {
  const { supabase, email } = await session();
  if (!email) return unauthorised();
  const tool = req.nextUrl.searchParams.get("tool");
  let q = supabase
    .from("saved_work")
    .select("id, tool, title, data, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(200);
  if (tool) q = q.eq("tool", tool);
  const { data, error } = await q;
  if (error) {
    console.error("saved GET:", error.message);
    return NextResponse.json({ error: tableMissing(error) ? NOT_SET_UP : "Could not load your saved work." }, { status: tableMissing(error) ? 503 : 500 });
  }
  return NextResponse.json({ result: data });
}

export async function POST(req: NextRequest) {
  const { supabase, email } = await session();
  if (!email) return unauthorised();
  const body = (await req.json()) as { id?: string; tool?: string; title?: string; data?: unknown };
  if (!body.tool || typeof body.tool !== "string") {
    return NextResponse.json({ error: "Missing tool name." }, { status: 400 });
  }
  const row = {
    user_email: email,
    tool: body.tool.slice(0, 60),
    title: String(body.title || "Untitled").slice(0, 200),
    data: body.data ?? {},
    updated_at: new Date().toISOString(),
  };
  // Insert or update, then read the row back: the screen only says "Saved"
  // when the database has confirmed it.
  const query = body.id
    ? supabase.from("saved_work").update(row).eq("id", body.id).select("id, tool, title, updated_at").single()
    : supabase.from("saved_work").insert(row).select("id, tool, title, updated_at").single();
  const { data, error } = await query;
  if (error || !data) {
    console.error("saved POST:", error?.message);
    return NextResponse.json(
      { error: tableMissing(error) ? NOT_SET_UP : "Could not save. Please try again." },
      { status: tableMissing(error) ? 503 : 500 }
    );
  }
  return NextResponse.json({ result: data });
}

export async function DELETE(req: NextRequest) {
  const { supabase, email } = await session();
  if (!email) return unauthorised();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  const { data, error } = await supabase.from("saved_work").delete().eq("id", id).select("id");
  if (error || !data?.length) {
    return NextResponse.json({ error: "Could not delete that item." }, { status: error ? 500 : 404 });
  }
  return NextResponse.json({ result: { id } });
}
