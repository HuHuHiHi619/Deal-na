import { supabase } from "@/app/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  console.log("Request received at /api/room/create");

  try {
    const body = await req.json();

    const { title, options, userId } = body;

    if (!title || !options || !Array.isArray(options) || options.length === 0)
      return NextResponse.json({ error: "Invalid options" });

    let roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    let isUnique = false;
    const origin = new URL(req.url).origin;
    while (!isUnique) {
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
      console.log("check room_code:", roomCode, "found:", data);
    }

    const { data: newRoom, error: newRoomError } = await supabase
      .from("room")
      .insert([{ title: title, room_code: roomCode }])
      .select("id , room_code , title")
      .single();
    if (newRoomError) {
      console.error("Insert error:", newRoomError.message);
    } else {
      console.log("Inserted room:", newRoom);
    }
    if (!newRoom) return NextResponse.json({ error: "Failed to create room" });

    const { data: owner, error: ownerError } = await supabase
      .from("room_members")
      .insert([{ user_id: userId, room_id: newRoom.id }])
      .select("id")
      .single();

    if (ownerError) {
      console.error("Failed to add room owner to members:", ownerError);
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
    if (newOptionsError)
      return NextResponse.json(
        { error: "Failed to create options" },
        { status: 500 }
      );

    return NextResponse.json({
      success: true,
      room: {
        id: newRoom.id,
        room_code: newRoom.room_code,
        title: newRoom.title,
        url: `${origin}/room/${newRoom.room_code}`,
      },
      options: newOptions,
      message: "Room created successfully",
    });
  } catch (error) {
    console.error("Error in API route:", error); // Log the general route error
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
