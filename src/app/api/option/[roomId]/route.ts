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

    if (!roomId) {
      return NextResponse.json({ error: 'Room Code not found' }, { status: 400 });
    }

    const { data: room, error: roomError } = await supabase
      .from('room')
      .select('id')
      .eq('id', roomId)
      .single();

    if (roomError) throw roomError;
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    const { data: options, error: optionsError } = await supabase
      .from('options')
      .select('id, title, user_id')
      .eq('room_id', room.id)
      .order('id', { ascending: true });

    if (optionsError) {
      throw optionsError;
    };

    return NextResponse.json({ options });
  } catch (error : unknown) {
    console.error("Get option api Error",error);
    const message = error instanceof Error 
    ? error.message 
    : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
