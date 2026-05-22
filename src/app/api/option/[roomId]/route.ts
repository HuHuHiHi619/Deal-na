import { getServerUser, supabase } from "@/app/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
    }
    const token = authHeader.replace("Bearer ", "");

    const { user, error: userError } = await getServerUser(token);
    if (!user || userError) {
      return NextResponse.json({ error: "User not found or session invalid" }, { status: 401 });
    }

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
