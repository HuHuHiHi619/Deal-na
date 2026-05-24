import { requireAuth } from "@/app/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;
    const { supabase } = auth;

    const { roomId } = await params;
    const { userId } = await req.json();

    if (!roomId || !userId) {
      return NextResponse.json(
        { error: "Room code or user id not found" },
        { status: 400 }
      );
    }

    const { data: room, error: roomError } = await supabase
      .from("room")
      .select("id , title")
      .eq("id", roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: "Room not found" });
    }

   
    const { data: existingMember, error: memberError } = await supabase
      .from("room_members")
      .select("id")
      .eq("room_id", roomId)
      .eq("user_id", userId)
      .maybeSingle();
      

     if (existingMember) {
      return NextResponse.json({
        newMemberId: existingMember.id,
        room: {
          id: room.id,
          title: room.title,
          url: `/room/${room.id}`,
        },
        alreadyMember: true, 
      });
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

    return NextResponse.json({
      newMemberId: newMember.id,
      room: {
        id: room.id,
        title: room.title,
        url: `/room/${room.id}`,
      },
    });
  }catch (error: unknown) {
  console.error("Error joining room:", error);
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}
}
