import { requireAuth } from "@/app/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const userId = user.id;

    const body = await req.json();

    const { title, options } = body;

    if (!title || !options || !Array.isArray(options) || options.length === 0)
      return NextResponse.json({ error: "Invalid options" }, { status: 400 });

    let roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    let isUnique = false;
    let attempts = 0;
    const MAX_RETRIES = 5;
    const origin = new URL(req.url).origin;
    while (!isUnique) {
      if (attempts >= MAX_RETRIES)
        return NextResponse.json({ error: "Failed to generate unique room code" }, { status: 500 });
      attempts++;
      const { data } = await supabase
        .from("room")
        .select("id")
        .eq("room_code", roomCode)
        .single();
      if (!data) {
        isUnique = true;
      } else {
        roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      }
    }

    const { data: newRoom, error: newRoomError } = await supabase
      .from("room")
      .insert([{ title: title, room_code: roomCode , created_by : userId }])
      .select("id , room_code , title")
      .single();
    if (newRoomError) {
      console.error("Insert error:", newRoomError.message);
    }
    if (!newRoom) return NextResponse.json({ error: "Failed to create room" }, { status: 500 });

    const { error: ownerError } = await supabase
      .from("room_members")
      .insert([{ user_id: userId, room_id: newRoom.id }]);

    if (ownerError) {
      console.error("[create/route] room_members insert error — code:", ownerError.code, "msg:", ownerError.message);
    }

    const optionLists = options
      .map((option) => ({
        title: option,
        room_id: newRoom.id,
        user_id: userId,
      }))
      .filter((option) => option.title !== "");

    const { data: newOptions, error: newOptionsError } = await supabase
      .from("options")
      .insert(optionLists)
      .select("id , user_id");
    if (newOptionsError) {
      console.error("[create/route] options insert error — code:", newOptionsError.code, "msg:", newOptionsError.message);
      return NextResponse.json(
        { error: "Failed to create options",},
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      room: {
        id: newRoom.id,
        room_code: newRoom.room_code,
        title: newRoom.title,
        url: `${origin}/room/${newRoom.id}`,
      },
      options: newOptions,
      message: "Room created successfully",
    });
  } catch (error: unknown) {
  console.error("Error joining room:", error);
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}
}