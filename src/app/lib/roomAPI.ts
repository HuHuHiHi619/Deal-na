import { supabase } from "./supabase";

export async function createRoomAPI(
  title: string,
  options: string[],
  userId: string
) {
  const { data : { session } } = await supabase.auth.getSession();
  const res = await fetch("/api/room/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" , 'Authorization': `Bearer ${session?.access_token}` },
    body: JSON.stringify({ title, options, userId }),
  });

  const data = await res.json()

  if (!res.ok || data.error) throw new Error(data.error || "Failed to create room");

  return data;
}

export async function joinRoomAPI(roomId: string, userId: string) {
 
  const res = await fetch(`/api/room/${roomId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ roomId , userId }),
  });
  
  const data = await res.json();
  
  
  if (!res.ok || data.error) {
    throw new Error(data.error || "Failed to join room");
  }
  
  return data;
}
