export async function getVoteAPI(roomId: string) {
  const res = await fetch(`/api/vote/result?roomId=${roomId}`);
  if (!res.ok) {
    if (res.status === 404 || res.status === 204) return [];
    throw new Error("Failed to get votes");
  }
  const data = await res.json()
  return data.formattedResult
}
