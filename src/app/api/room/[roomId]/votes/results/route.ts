import { requireAuth } from "@/app/lib/supabase";
import { NextResponse } from "next/server";

interface VoteResults {
  option_id: string;
  title: string;
  vote_count: number;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;
    const { supabase } = auth;
    const { roomId } = await params;

    if (!roomId)
      return NextResponse.json({ error: "Room id not found" }, { status: 400 });

    const [
      { data: results, error: resultsError },
      { data: votes, error: votesError },
    ] = await Promise.all([
      supabase.rpc("get_vote", { room: roomId }),
      supabase
        .from("votes")
        .select("id, option_id, room_id, user_id")
        .eq("room_id", roomId),
    ]);

    if (resultsError) throw resultsError;
    if (votesError) throw votesError;

    const formattedResult = (results ?? []).map((r: VoteResults) => ({
      optionId: r.option_id,
      title: r.title,
      voteCount: r.vote_count,
    }));

    return NextResponse.json({ formattedResult, votes: votes ?? [] });
  } catch (error: unknown) {
    console.error("Error joining room:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
