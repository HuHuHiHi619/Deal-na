import { requireAuth } from "@/app/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;
    const { supabase } = auth;

    const { roomId } = await params;

    const { data, error } = await supabase
      .from("room_members")
      .select("user_id")
      .eq("room_id", roomId);

    if (error) throw error;

    const members = (data ?? []).map((row: { user_id: string }) => row.user_id);
    return NextResponse.json(members);
  } catch (error: unknown) {
    console.error("GET members error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
