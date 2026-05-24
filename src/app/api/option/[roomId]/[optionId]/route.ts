import { requireAuth } from "@/app/lib/supabase";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ roomId: string; optionId: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const { roomId, optionId } = await params;

    if (!roomId || !optionId)
      return NextResponse.json({ error: 'roomId and optionId required' }, { status: 400 });

    const { error } = await supabase
      .from('options')
      .delete()
      .eq('id', optionId)
      .eq('room_id', roomId)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Delete option api Error", error);
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
