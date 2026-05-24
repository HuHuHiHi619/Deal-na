import { createServerClient } from "../lib/supabase";

export interface VoteProps {
  roomId: string;
  optionId: string;
  userId: string;
  token: string;
}

export async function createVote({ roomId, optionId, userId, token }: VoteProps) {
  try {
    const client = createServerClient(token);
    const { data, error } = await client
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
    console.error(" createVote service error:", error);
    return false;
  }
}

export async function deleteVote({ optionId, roomId, userId, token }: VoteProps) {
  try {
    const client = createServerClient(token);
    const { error } = await client
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

    return true;
  } catch (error) {
    console.error("deleteVote service error : ", error);
    return false;
  }
}
