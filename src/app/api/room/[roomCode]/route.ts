import { supabase } from "@/app/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  console.log("Request received at /api/room/[roomCode]");
  try {
    const { roomCode } = await params;
    const { userId } = await req.json();

    if (!roomCode || !userId) {
      return NextResponse.json(
        { error: "Room code or user id not found" },
        { status: 400 }
      );
    }

    const { data: room, error: roomError } = await supabase
      .from("room")
      .select("id , title")
      .eq("room_code", roomCode)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: "Room not found" });
    }

    const roomId = room.id;

    const { data: existingMember, error: memberError } = await supabase
      .from("room_members")
      .select("id")
      .eq("room_id", roomId)
      .eq("user_id", userId)
      .maybeSingle();

     if (existingMember) {
      return NextResponse.json(
        { error: "User already in room" },
        { status: 400 }
      );
    }

      if (memberError && memberError.code !== 'PGRST116') {
      console.error('Member check error:', memberError);
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }

    const { data: newMember, error: newMemberError } = await supabase
      .from("room_members")
      .insert({ room_id: roomId, user_id: userId })
      .select("id, user_id, room_id, join_at") 
      .single();
    if (newMemberError) throw newMemberError;

    console.log('New member:', newMember);

    return NextResponse.json({
      newMemberId: newMember.id,
      room: {
        id: room.id,
        room_code: roomCode,
        title: room.title,
        url: `/room/${roomCode}`,
      },
    });
  } catch (error) {
    console.error("Error joining room:", error);
    return NextResponse.json({
      error: "Failed to join room"
    },{status : 500})
  }
}
