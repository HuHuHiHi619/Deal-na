import { supabase } from "@/app/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  
  const url = new URL(req.url);
  const pathSegments = url.pathname.split('/');
  const roomId = pathSegments[pathSegments.length - 1]; 
  
  if (!roomId) {
    return NextResponse.json({ error: 'Room Code not found' }, { status: 400 });
  }

  console.log('roomId parsed from URL:', roomId);


  try {
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
      console.log("optionsError :", optionsError.message);
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
