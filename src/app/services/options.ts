import { createServerClient } from "../lib/supabase";

export interface CreateOptionProps {
  roomId: string;
  options: string[];
  userId: string;
  token: string;
}
export interface DeleteOptionProps {
  roomId: string;
  optionId: string;
  userId: string;
  token: string;
}

export async function getOptions(roomId: string, token: string) {
  try {
    const client = createServerClient(token);
    const { data, error } = await client
      .from("options")
      .select("*")
      .eq("room_id", roomId);
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(error);
  }
}

export async function createOption({
  roomId,
  options,
  userId,
  token,
}: CreateOptionProps) {
  try {
    const client = createServerClient(token);
    const optionsToInsert = options.map((opt) => ({
      room_id: roomId,
      title: opt,
      user_id: userId,
    }));
    const { data, error } = await client
      .from("options")
      .insert(optionsToInsert)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(error);
  }
}

export async function deleteOption({
  optionId,
  roomId,
  userId,
  token,
}: DeleteOptionProps) {
  try {
    const client = createServerClient(token);
    const { error } = await client
      .from("options")
      .delete()
      .eq("room_id", roomId)
      .eq("id", optionId)
      .eq("user_id", userId)
      .select();

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("deleteOption service error ", error);
    return false;
  }
}
