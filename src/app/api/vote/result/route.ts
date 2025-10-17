import { supabase } from "@/app/lib/supabase";
import { NextResponse } from "next/server";


export async function GET (req : Request){
    try{
        const { searchParams } = new URL(req.url);
        const roomId = searchParams.get('roomId');
        
        if(!roomId) return NextResponse.json({ error : 'Room id not found' });

       const { data: results, error: resultsError } = await supabase
        .rpc('get_vote' , { room : roomId }) 

        if(resultsError) throw resultsError;

        const formattedResult = results.map((r : any) => ({
            optionId : r.option_id,
            title : r.title,
            voteCount : r.vote_count
        }))
   
        if(resultsError) throw resultsError;
        console.log('formattedResult' , formattedResult);
        return NextResponse.json({ formattedResult });
    }catch(error){console.error(error)}
}