export async function createRoomAPI(title: string, options: string[], token: string) {
  const res = await fetch("/api/room/create", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title, options }),
  });

  const data = await res.json();

  if (!res.ok || data.error) throw new Error(data.error || "Failed to create room");

  return data;
}
