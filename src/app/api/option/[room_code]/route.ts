import { supabase } from "@/app/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  
  const url = new URL(req.url);
  const pathSegments = url.pathname.split('/');
  const room_code = pathSegments[pathSegments.length - 1]; // ค่าสุดท้าย
  
  if (!room_code) {
    return NextResponse.json({ error: 'Room Code not found' }, { status: 400 });
  }

  console.log('room_code parsed from URL:', room_code);

  // --- Supabase query ตามปกติ ---
  try {
    const { data: room, error: roomError } = await supabase
      .from('room')
      .select('id')
      .eq('room_code', room_code)
      .single();

    if (roomError) throw roomError;
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    const { data: options, error: optionsError } = await supabase
      .from('options')
      .select('id, title, user_id')
      .eq('room_id', room.id)
      .order('id', { ascending: true });

    if (optionsError) throw optionsError;

    return NextResponse.json({ options });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
