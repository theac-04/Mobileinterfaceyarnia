import { useEffect } from "react";

interface MascotPopupProps {
  ownerName: string;
  position: { x: number; y: number };
  onYes: () => void;
  onNo: () => void;
}

export function MascotPopup({ ownerName, position, onYes, onNo }: MascotPopupProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onNo();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onNo]);

  return (
    <div
      className="absolute z-50"
      style={{
        left: position.x + 50, // Offset from the block
        top: position.y - 80, // Above the block
        transform: "translateX(-50%)",
      }}
    >
      <div
        className="bg-white rounded-2xl p-4 shadow-2xl border border-gray-200 max-w-xs"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="text-3xl">🐻</div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-1">Oh! {ownerName} has written more!</p>
            <p className="text-sm font-medium">Wanna contribute to {ownerName === "me" ? "your" : "their"} other works?</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onYes}
            className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors text-sm"
          >
            Yes
          </button>
          <button
            onClick={onNo}
            className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors text-sm"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}