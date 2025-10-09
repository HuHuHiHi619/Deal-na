import { QRCodeSVG } from "qrcode.react";
import { useRoom } from "../store/room/useRoomStore";
import Link from "next/link";

export default function ShareRoom() {
  const { currentRoom } = useRoom();

  if (!currentRoom) return null;
  return (
    <div className="bg-amber-600 p-4">
      <h1>Share Room with your friend</h1>
      <Link href={currentRoom.url || ''} target="_blank">
        <p className="bg-blue-500 text-white p-4">{currentRoom.url}</p>
      </Link>
      <div>
        {currentRoom.url ? <QRCodeSVG value={currentRoom.url} /> : null}
      </div>
    </div>
  );
}
