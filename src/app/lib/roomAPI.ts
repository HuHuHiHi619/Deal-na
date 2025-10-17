export async function createRoomAPI(
  title: string,
  options: string[],
  userId: string
) {
  const res = await fetch("/api/room/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, options, userId }),
  });
  if (!res.ok) throw new Error("Failed to create room");
  return res.json();
}

export async function joinRoomAPI(roomCode: string, userId: string) {
  console.log('joinRoomAPI called with roomCode:', roomCode, 'and userId:', userId);
  const res = await fetch(`/api/room/${roomCode}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ roomCode, userId }),
  });
  console.log('joinRoomAPI response:', res);
  const data = await res.json();
  
  // 👇 ถ้า response ไม่ ok หรือมี error ใน data ให้ throw error
  if (!res.ok || data.error) {
    throw new Error(data.error || "Failed to join room");
  }
  
  return data;
}
