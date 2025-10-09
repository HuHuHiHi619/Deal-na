import { supabase } from "@/app/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { roomCode: string } }
) {
  console.log("Request received at /api/room/[roomCode]");
  try {
    const { roomCode } = params;
    const { userId } = await req.json();

    console.log("roomCode", roomCode);
    const { data: room, error: roomError } = await supabase
      .from("room")
      .select("id , title , options")
      .eq("room_code", roomCode)
      .maybeSingle();

    if (roomError || !room) {
      return NextResponse.json({ error: "Room not found" });
    }

    const roomId = room.id;

    const { data: existingMember, error: memberError } = await supabase
      .from("room_member")
      .select("id")
      .eq("room_id", roomId)
      .eq("user_id", userId)
      .single();

    if (memberError || existingMember) {
      return NextResponse.json({ error: "User already in room" });
    }

    const { data: newMember, error: newMemberError } = await supabase
      .from("room_member")
      .insert({ room_id: roomId, user_id: userId })
      .select("id")
      .single();
    if (newMemberError) throw newMemberError;

    return NextResponse.json({
      newMemberId: newMember.id,
      room: {
        id: room.id,
        room_code: roomCode,
        title: room.title,
        url: `/room/${roomCode}`,
        options: room.options,
      },
    });
  } catch (error) {
    console.error("Error joining room:", error);
  }
}
