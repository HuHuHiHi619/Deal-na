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
  const res = await fetch(`/api/room/${roomCode}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ roomCode, userId }),
  });

  if (!res.ok) throw new Error("Failed to create room");
  return res.json();
}
