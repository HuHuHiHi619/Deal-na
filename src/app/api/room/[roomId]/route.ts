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

    const { data: room, error } = await supabase
      .from("room")
      .select("id, room_code, title, status, created_at, expired_at, created_by, started_at")
      .eq("id", roomId)
      .single();

    if (error || !room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json({ room });
  } catch (error: unknown) {
    console.error("GET room error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;
    const {user , supabase } = auth;

    const { roomId } = await params;
    const userId = user.id;

    if (!roomId) {
      return NextResponse.json(
        { error: "Room id not found" },
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
      .select("id, user_id, room_id, joined_at") 
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
