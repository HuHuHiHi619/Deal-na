import { requireAuth } from "@/app/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const { roomId } = await params;

    const { error } = await supabase
      .from("room")
      .update({ started_at: new Date().toISOString() })
      .eq("id", roomId)
      .eq("created_by", user.id); // RLS: only host can start

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error("POST start error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
