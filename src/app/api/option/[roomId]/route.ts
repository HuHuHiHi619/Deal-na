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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const { roomId } = await params;
    const { options } = await req.json();

    if (!roomId) return NextResponse.json({ error: 'Room id not found' }, { status: 400 });
    if (!Array.isArray(options) || options.length === 0)
      return NextResponse.json({ error: 'Options required' }, { status: 400 });

    const rows = options
      .filter((t: string) => t.trim() !== '')
      .map((title: string) => ({ room_id: roomId, title, user_id: user.id }));

    const { data, error } = await supabase
      .from('options')
      .insert(rows)
      .select('id, title, user_id');
    if (error) throw error;

    return NextResponse.json({ options: data });
  } catch (error: unknown) {
    console.error("Post option api Error", error);
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
