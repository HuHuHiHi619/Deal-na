import { QRCodeSVG } from "qrcode.react";
import { useRoom } from "../store/room/useRoomStore";
import Link from "next/link";

export default function ShareRoom() {
  const { currentRoom } = useRoom();

  if (!currentRoom) return null;
  return (
    <div className="bg-gradient-to-br from-rose-100 to-amber-50 p-6 rounded-2xl shadow-sm border border-rose-200/50">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-rose-100 rounded-full mb-3">
          <svg
            className="w-6 h-6 text-rose-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-light text-rose-700 mb-2">
          Share Room with Friends
        </h1>
        <p className="text-gray-600 text-sm">
          Invite friends to join your voting session
        </p>
      </div>

      {/* Room URL Link */}
      <div className="mb-6">
        <Link href={currentRoom.url || ""} target="_blank">
          <div className="bg-white/80 backdrop-blur-sm border border-rose-200 rounded-xl p-4 hover:bg-white hover:border-rose-300 transition-all duration-300 group cursor-pointer">
            <div className="flex items-center justify-between">
              <p className="text-gray-700 font-medium truncate mr-3">
                {currentRoom.url}
              </p>
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-rose-400 group-hover:text-rose-500 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* QR Code */}
      {currentRoom.url && (
        <div className="text-center">
          <div className="inline-block bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-rose-200 shadow-sm">
            <div className="mb-3">
              <p className="text-sm text-gray-600 font-medium">Scan QR Code</p>
            </div>
            <div className="p-3 bg-white rounded-lg inline-block">
              <QRCodeSVG
                value={currentRoom.url}
                size={140}
                level="M"
                bgColor="#fdf2f8"
                fgColor="#be185d"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
