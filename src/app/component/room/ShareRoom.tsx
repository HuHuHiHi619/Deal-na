'use client';
import { QRCodeSVG } from "qrcode.react";
import { usePortal } from "../../hooks/usePortal";
import { Copy, Check, X } from "lucide-react";
import useClipboard from "../../hooks/useClipboard";
import { useEffect, useState } from "react";

interface ShareRoomProps {
  room: { url?: string }
  onClose: () => void
}

export default function ShareRoom({ room, onClose }: ShareRoomProps) {
  const portal = usePortal();
  const { isCopied, copyToClipboard } = useClipboard();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 500);
    return () => clearTimeout(timer);
  }, []);

  if (!room) return null;

  return portal(
    <div className="popup-center w-[320px] rounded-4xl bg-card p-6 shadow-lg">
      {!showContent ? (
        <div className="py-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-line border-t-coral" />
          </div>
          <p className="type-heading text-ink">Preparing your room...</p>
          <p className="type-caption mt-2 text-muted">Almost ready!</p>
        </div>
      ) : (
        <>
          <div className="mb-5 text-center">
            <p className="type-eyebrow text-coral">Room ready</p>
            <h1 className="type-title mt-2 text-ink">Invite the crew 🎉</h1>
            <p className="type-caption mt-1 text-muted">scan or copy the link below</p>
          </div>

          {/* QR Code */}
          {room.url && (
            <div className="mb-5 flex justify-center">
              <QRCodeSVG value={room.url} size={172} level="M" bgColor="#FFFFFF" fgColor="#1F1B2E" />
            </div>
          )}

          {/* Room URL Link */}
          <div className="flex items-center gap-3 rounded-2xl bg-cream p-2 pl-4">
            <p className="type-caption flex-1 truncate text-ink">{room.url}</p>
            <button
              onClick={() => copyToClipboard(room.url || "")}
              className="type-caption flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 font-semibold text-cream transition-transform hover:scale-[1.03]"
            >
              {isCopied ? <Check size={15} /> : <Copy size={15} />}
              {isCopied ? "copied" : "copy"}
            </button>
          </div>

          <div className="mt-5 flex justify-center">
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-line text-ink transition-transform hover:scale-105"
            >
              <X size={20} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
