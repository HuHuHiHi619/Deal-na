import { supabase } from "../lib/supabase";

export interface CreateOptionProps {
  roomId: string;
  options: string[];
  userId: string;
}
export interface DeleteOptionProps {
  roomId: string;
  optionId: string;
  userId: string;
}

export async function getOptions(roomId: string) {
  try {
    const { data, error } = await supabase
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
}: CreateOptionProps) {
  try {
    const optionsToInsert = options.map((opt) => ({
      roomId: roomId,
      title: opt,
      user_id: userId,
    }));
    const { data, error } = await supabase
      .from("options")
      .insert(optionsToInsert)
      .single();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error(error);
  }
}
export async function deleteOption({
  optionId,
  roomId,
  userId,
}: DeleteOptionProps) {
  try {
    const { data, error } = await supabase
      .from("options")
      .delete()
      .eq("room_id", roomId)
      .eq("id", optionId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error("deleteOption service error ",error);
    return false
  }
}
