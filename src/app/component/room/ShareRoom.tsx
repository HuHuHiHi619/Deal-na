import { QRCodeSVG } from "qrcode.react";
import { useRoom } from "../../store/room/useRoomStore";
import Link from "next/link";
import { usePortal } from "../../hooks/usePortal";
import { useUiStore } from "../../store/useUiStore";
import { Copy, X } from "lucide-react";
import useClipboard from "../../hooks/useClipboard";
import { useEffect, useState } from "react";

export default function ShareRoom() {
  const { currentRoom } = useRoom();
  const { setIsPopup, isLoading } = useUiStore();
  const portal = usePortal();
  const { isCopied, copyToClipboard } = useClipboard();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (currentRoom && isLoading('popupQr')) {
    
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [currentRoom, isLoading('popupQr')]);

  if (!currentRoom) return null;

  return portal(
    <div className="popup-center bg-amber-100/20 backdrop-blur-2xl p-6 rounded-2xl shadow-sm border border-rose-200/50">
      {!showContent ? (
        <div className="text-center py-8">
          <div className="flex justify-center mb-4">
            <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-700 text-lg font-medium tracking-wide">
            Preparing your room...
          </p>
          <p className="text-gray-500 text-sm mt-2">Almost ready!</p>
        </div>
      ) : (
      
        <>
          <div className="text-center mb-6">
            <h1 className="text-2xl font-light text-rose-700 mb-2">
              Share Room with Friends
            </h1>
            <p className="text-gray-600 text-sm">
              Invite friends to join your voting session
            </p>
          </div>

          {/* Room URL Link */}
          <div className="mb-6">
            <div className="bg-rose-100 rounded-xl p-4 hover:bg-rose-400/50 shadow-md hover:border-rose-300 transition-all duration-300 group cursor-pointer relative">
              <Link href={currentRoom.url || ""}>
                <div className=" flex items-center justify-between">
                  <p className="text-gray-700 font-medium truncate mr-3">
                    {currentRoom.url}
                  </p>
                </div>
              </Link>
              <button
                onClick={() => copyToClipboard(currentRoom.url || "")}
                disabled={isCopied}
                className={`
                  absolute right-3 top-1/2 transform -translate-y-1/2
                  p-2 rounded-lg transition-all duration-300
                  ${
                    isCopied
                      ? "bg-gray-800 text-gray-500 scale-110"
                      : "bg-rose-50 text-rose-400 hover:bg-rose-100 hover:text-rose-600 hover:scale-105"
                  }
                  group-hover:shadow-md
                  disabled:opacity-50 disabled:cursor-not-allowed
                  focus:outline-none focus:ring-2 focus:ring-rose-300 focus:ring-offset-2
                `}
              >
                <Copy size={20} />
              </button>
            </div>
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
          <div className="flex justify-center">
            <button
              onClick={() => setIsPopup(false)}
              className="bg-rose-400 text-white p-2 mt-4 rounded-full hover:scale-105 hover:bg-rose-500 cursor-pointer transition-all duration-300"
            >
              <X size={30} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}