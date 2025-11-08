import { error } from "console";
import { supabase } from "../lib/supabase";

export interface VoteProps {
  roomId: string;
  optionId: string;
  userId: string;
}

export async function createVote({ roomId, optionId, userId }: VoteProps) {
  try {
    const { data, error } = await supabase
      .from("votes")
      .insert([
        {
          room_id: roomId,
          option_id: optionId,
          user_id: userId,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(error);
  }
}
export async function deleteVote({ optionId, roomId, userId }: VoteProps) {
  try {
    const { error } = await supabase
      .from("votes")
      .delete()
      .eq("room_id", roomId)
      .eq("option_id", optionId)
      .eq("user_id", userId)
      .select();

    if (error) {
      console.error("Supabase delete error:", error);
      return false;
    }

    return true; // ✅ return boolean เสมอ
  } catch (error) {
    console.error("deleteVote service error : ", error);
  }
}
