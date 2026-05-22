import { getServerUser, supabase } from "@/app/lib/supabase";
import { NextResponse } from "next/server";

interface VoteResults {
    option_id : string
    title : string
    vote_count: number
}

export async function GET (req : Request){
    try{
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
          return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
        }
        const token = authHeader.replace("Bearer ", "");

        const { user, error: userError } = await getServerUser(token);
        if (!user || userError) {
          return NextResponse.json({ error: "User not found or session invalid" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const roomId = searchParams.get('roomId');

        if(!roomId) return NextResponse.json({ error : 'Room id not found' }, { status: 400 });

       const { data: results, error: resultsError } = await supabase
        .rpc('get_vote' , { room : roomId }) 

        if(resultsError) throw resultsError;

        const formattedResult = results.map((r : VoteResults) => ({
            optionId : r.option_id,
            title : r.title,
            voteCount : r.vote_count
        }))
   
        if(resultsError) throw resultsError;
        return NextResponse.json({ formattedResult });
    }catch (error: unknown) {
  console.error("Error joining room:", error);
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}
}