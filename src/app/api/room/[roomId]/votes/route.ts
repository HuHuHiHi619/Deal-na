import { requireAuth } from "@/app/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;
    const { roomId } = await params;
    const { optionId } = await req.json();

    if (!roomId || !optionId)
      return NextResponse.json(
        { error: "roomId and optionId required" },
        { status: 400 },
      );

    const { data, error } = await supabase
      .from("votes")
      .insert([{ room_id: roomId, option_id: optionId, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ votes: data });
  } catch (error: unknown) {
    console.error("Post vote api Error", error);
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const { roomId } = await params;
    const { optionId } = await req.json();

    if (!roomId || !optionId)
      return NextResponse.json(
        { error: "roomId and optionId required" },
        { status: 400 },
      );

    const { error } = await supabase
      .from("votes")
      .delete()
      .eq("room_id", roomId)
      .eq("option_id", optionId)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Delete vote api Error", error);
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
