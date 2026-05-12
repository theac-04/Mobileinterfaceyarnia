import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue } from "motion/react";
import { HexColorPicker } from "react-colorful";
import { Palette, Maximize2 } from "lucide-react";

type ContentBlock =
  | { type: "text";  content: string; x: number; y: number; width: number; rotation?: number; color?: string; zIndex?: number; float?: 'left' | 'right'; ownerId?: string; ownerName?: string }
  | { type: "image"; url: string; caption?: string; x: number; y: number; width: number; rotation?: number; color?: string; zIndex?: number; float?: 'left' | 'right'; ownerId?: string; ownerName?: string }
  | { type: "quote"; text: string; x: number; y: number; width: number; rotation?: number; color?: string; zIndex?: number; float?: 'left' | 'right'; ownerId?: string; ownerName?: string }
  | { type: "music"; url: string; title: string; accentColor?: string; x: number; y: number; width: number; rotation?: number; color?: string; zIndex?: number; float?: 'left' | 'right'; ownerId?: string; ownerName?: string }
  | { type: "video"; url: string; caption?: string; x: number; y: number; width: number; rotation?: number; color?: string; zIndex?: number; float?: 'left' | 'right'; ownerId?: string; ownerName?: string }
  | { type: "bookText"; content: string; x: number; y: number; width: number; rotation?: number; color?: string; zIndex?: number; float?: 'left' | 'right'; ownerId?: string; ownerName?: string }
  | { type: "note"; content: string; x: number; y: number; width: number; rotation?: number; color?: string; zIndex?: number; float?: 'left' | 'right'; ownerId?: string; ownerName?: string }
  | { type: "background"; content: string; x: number; y: number; width: number; rotation?: number; color?: string; zIndex?: number; ownerId?: string; ownerName?: string };

interface ScrapbookBlockProps {
  block: ContentBlock;
  index: number;
  isEditing: boolean;
  isSelected: boolean;
  canvasWidth?: number;
  canvasHeight?: number;
  onSelect: (index: number) => void;
  onUpdate: (index: number, updates: Partial<ContentBlock>) => void;
  onDelete: (index: number) => void;
  onContentChange: (index: number, field: string, value: string) => void;
  currentUserId: string;
}

const DEFAULT_COLORS: Record<string, string> = {
  text:  "#fef9c3",
  quote: "#f3e8ff",
  image: "#ffffff",
  music: "#fce7f3",
  video: "#1e1b2e",
  bookText: "#000000",
  note: "#fef3c7",
  background: "#000000",
};

export function ScrapbookBlock({
  block,
  index,
  isEditing,
  isSelected,
  canvasWidth = 340,
  canvasHeight = 600,
  onSelect,
  onUpdate,
  onDelete,
  onContentChange,
  currentUserId,
}: ScrapbookBlockProps) {
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);

  const x = block.x ?? 0;
  const y = block.y ?? 0;
  const width = block.type === "background" ? canvasWidth : (block.width ?? 200);
  const rotation = block.rotation ?? 0;
  const bgColor = block.color ?? DEFAULT_COLORS[block.type] ?? "#ffffff";
  const textColor = getContrastColor(bgColor);
  // Muted variant — same hue, 65% opacity — for captions / secondary labels
  const mutedColor = textColor === "#ffffff" ? "rgba(255,255,255,0.65)" : "rgba(55,65,81,0.65)";

  const [showPicker, setShowPicker] = useState(false);
  const [showAccentPicker, setShowAccentPicker] = useState(false);
  const accentPickerRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  // Stop pointerdown from reaching Motion's native drag listener so the
  // colour wheel can be dragged without moving the block.
  useEffect(() => {
    const el = pickerRef.current;
    if (!el) return;
    const stop = (e: PointerEvent) => e.stopPropagation();
    el.addEventListener("pointerdown", stop);
    return () => el.removeEventListener("pointerdown", stop);
  }, []);

  // Stop dragging when interacting with the Music accent color wheel
  useEffect(() => {
    const el = accentPickerRef.current;
    if (!el) return;
    const stop = (e: PointerEvent) => e.stopPropagation();
    el.addEventListener("pointerdown", stop);
    return () => el.removeEventListener("pointerdown", stop);
  }, [showAccentPicker]);

  // Apply the same native stopPropagation to all interactive elements inside
  // the card (textarea, input, audio) so that typing / scrubbing / clicking
  // them doesn't accidentally trigger Motion's drag on the block.
  useEffect(() => {
    const card = cardRef.current;
    if (!card || !isEditing || !isSelected) return;
    const stop = (e: PointerEvent) => e.stopPropagation();
    const interactives = card.querySelectorAll<HTMLElement>("textarea, input, audio");
    interactives.forEach((el) => el.addEventListener("pointerdown", stop));
    return () => interactives.forEach((el) => el.removeEventListener("pointerdown", stop));
  }, [isEditing, isSelected]);

  // Close the picker when clicking outside of it
  useEffect(() => {
    if (!showPicker) return;
    const handleOutside = (e: PointerEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    window.addEventListener("pointerdown", handleOutside);
    return () => window.removeEventListener("pointerdown", handleOutside);
  }, [showPicker]);

  // Close the accent picker when clicking outside of it
  useEffect(() => {
    if (!showAccentPicker) return;
    const handleOutside = (e: PointerEvent) => {
      if (accentPickerRef.current && !accentPickerRef.current.contains(e.target as Node)) {
        setShowAccentPicker(false);
      }
    };
    window.addEventListener("pointerdown", handleOutside);
    return () => window.removeEventListener("pointerdown", handleOutside);
  }, [showAccentPicker]);

  const handleDragEnd = (_: any, info: any) => {
    if (!isEditing || !isSelected) return;
    const newX = Math.max(0, Math.min(canvasWidth - width, x + info.offset.x));
    const newY = Math.max(0, Math.min(canvasHeight - 100, y + info.offset.y)); // approximate block height 100
    dragX.set(0);
    dragY.set(0);
    onUpdate(index, { x: newX, y: newY });
  };

  const handleColorChange = (color: string) => {
    onContentChange(index, "color", color);
  };

  const handleAccentColorChange = (color: string) => {
    onContentChange(index, "accentColor", color);
  };

  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Stop the event from reaching Motion's native pointerdown listener on the
    // parent motion.div — React's stopPropagation alone isn't enough because
    // Motion attaches native (non-React) listeners directly to the DOM node.
    e.nativeEvent.stopPropagation();
    e.stopPropagation();
    e.preventDefault();

    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = width;

    const onMove = (ev: PointerEvent) => {
      const delta = ev.clientX - startX;
      const newWidth = Math.max(80, Math.min(canvasWidth - x - 4, startWidth + delta));
      onUpdate(index, { width: newWidth });
    };

    const onUp = () => {
      setIsResizing(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <motion.div
      drag={block.type !== "background" && isEditing && isSelected && !showPicker && !showAccentPicker && !isResizing}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      dragElastic={0}
      dragConstraints={{
        left: 0,
        right: Math.max(0, canvasWidth - width - 4),
        top: 0,
        bottom: Math.max(0, canvasHeight - 120),
      }}
      className="absolute"
      style={{
        ...(block.type === "background" ? { position: 'absolute', left: 0, top: 0, width: canvasWidth, height: canvasHeight, zIndex: 0 } : block.float ? { position: 'relative', float: block.float } : { position: 'absolute', left: x, top: y }),
        width: block.type === "background" ? canvasWidth : width,
        rotate: `${rotation}deg`,
        zIndex: block.type === "background" ? 0 : isSelected ? 9999 : (block.zIndex ?? (block.type === "bookText" ? 0 : index * 2 + 1)),
        touchAction: isEditing && isSelected ? "none" : "auto",
      }}
      animate={block.type !== "background" ? { scale: isSelected ? 1.05 : 1 } : {}}
      transition={block.type !== "background" ? { type: "spring", stiffness: 300, damping: 25 } : {}}
      whileDrag={block.type !== "background" ? { scale: 1.1, zIndex: 200 } : {}}
    >
      <div
        className={block.type === "background" ? "" : `relative ${isEditing ? "cursor-grab active:cursor-grabbing" : ""}`}
        ref={cardRef}
        style={{ touchAction: isEditing && isSelected ? "none" : "auto" }}
        onClick={block.type !== "background" && isEditing ? (e) => { e.stopPropagation(); onSelect(index); } : undefined}
      >
        {/* Selection border */}
        {block.type !== "background" && isSelected && isEditing && (
          <div className="absolute -inset-2 border-2 border-blue-500 rounded-lg pointer-events-none" />
        )}

        {/* Colour picker trigger — top-right */}
        {block.type !== "background" && isSelected && isEditing && (
          <div
            ref={pickerRef}
            className="absolute -top-3 -right-3 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-7 h-7 rounded-full border-2 border-white shadow-md flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
              style={{ backgroundColor: bgColor }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); setShowPicker((v) => !v); }}
              title="Choose colour"
            >
              <Palette size={12} style={{ color: getContrastColor(bgColor) }} />
            </button>

            {showPicker && (
              <div
                className="absolute right-0 top-9 bg-white rounded-2xl shadow-2xl p-3 border border-gray-100"
                style={{ zIndex: 9999 }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <HexColorPicker color={bgColor} onChange={handleColorChange} />
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full border border-gray-300 flex-shrink-0" style={{ backgroundColor: bgColor }} />
                  <span className="text-xs text-gray-500 font-mono uppercase">{bgColor}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Resize handle — bottom-right corner */}
        {block.type !== "background" && isEditing && isSelected && (
          <div
            className="absolute -bottom-3 -right-3 w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-md flex items-center justify-center"
            style={{ touchAction: "none", zIndex: 201, cursor: "se-resize" }}
            onPointerDown={handleResizePointerDown}
          >
            <Maximize2 size={10} className="text-white" style={{ transform: "rotate(90deg)" }} />
          </div>
        )}

        {/* ── TEXT ── */}
        {block.type === "text" && (
          <div className="p-3 rounded shadow-lg border-2" style={{ backgroundColor: bgColor, borderColor: darken(bgColor, 0.1) }}>
            {isEditing && isSelected ? (
              <textarea
                value={block.content}
                onChange={(e) => onContentChange(index, "content", e.target.value)}
                className="w-full bg-transparent border-none outline-none resize-none text-sm"
                style={{ color: textColor }}
                rows={3}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <p className="text-sm" style={{ color: textColor }}>{block.content}</p>
            )}
          </div>
        )}

        {/* ── QUOTE ── */}
        {block.type === "quote" && (
          <div className="p-3 rounded shadow-lg border-l-4" style={{ backgroundColor: bgColor, borderLeftColor: darken(bgColor, 0.25) }}>
            {isEditing && isSelected ? (
              <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                <textarea
                  value={block.text}
                  onChange={(e) => onContentChange(index, "text", e.target.value)}
                  className="w-full bg-transparent border-none outline-none resize-none text-sm italic"
                  style={{ color: textColor }}
                  rows={2}
                />
              </div>
            ) : (
              <p className="text-sm italic" style={{ color: textColor }}>{block.text}</p>
            )}
          </div>
        )}

        {/* ── IMAGE ── */}
        {block.type === "image" && (
          <div className="p-2 rounded shadow-lg" style={{ backgroundColor: bgColor }}>
            {isEditing && isSelected ? (
              <div onClick={(e) => e.stopPropagation()}>
                <div className="flex gap-1 mb-1">
                  <input
                    type="text"
                    value={block.url}
                    onChange={(e) => onContentChange(index, "url", e.target.value)}
                    placeholder="Image URL"
                    className="flex-1 p-1 border rounded text-xs"
                  />
                  <label className="px-2 py-1 bg-blue-500 text-white rounded text-xs cursor-pointer hover:bg-blue-600 flex items-center">
                    📁
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => onContentChange(index, "url", ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                {block.url && <img src={block.url} alt="" draggable={false} style={{ pointerEvents: "none" }} className="w-full rounded mb-1" />}
                <input
                  type="text"
                  value={block.caption || ""}
                  onChange={(e) => onContentChange(index, "caption", e.target.value)}
                  placeholder="Caption"
                  className="w-full p-1 border rounded text-xs"
                />
              </div>
            ) : (
              <>
                {block.url && <img src={block.url} alt={block.caption} draggable={false} style={{ pointerEvents: "none" }} className="w-full rounded" />}
                {block.caption && <p className="text-xs mt-1 text-center" style={{ color: mutedColor }}>{block.caption}</p>}
              </>
            )}
          </div>
        )}

 {/* ── MUSIC ── */}
        {block.type === "music" && (() => {
          const cardVisible = isEditing && isSelected;
          const cardStyle = cardVisible ? { backgroundColor: bgColor } : { backgroundColor: "transparent" };
          const cardClass  = cardVisible ? "p-3 rounded shadow-lg" : "p-1";

          // ADD THIS LINE: Check if it's a YouTube link
          const ytId = getYouTubeVideoId(block.url);

          return (
            <div className={cardClass} style={cardStyle}>
              {isEditing && !isSelected && (
                <button
                  className="absolute -top-3 -right-3 z-50 flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white rounded-full px-2 py-0.5 shadow"
                  style={{ fontSize: "10px", lineHeight: 1.4 }}
                  onClick={(e) => { e.stopPropagation(); onSelect(index); }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  ✎ edit
                </button>
              )}

              {isEditing && isSelected ? (
                <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={block.title}
                    onChange={(e) => onContentChange(index, "title", e.target.value)}
                    placeholder="Song title"
                    className="w-full p-1.5 border rounded text-xs bg-white/80"
                  />

                  <label className="flex items-center justify-center gap-2 w-full px-3 py-2.5 bg-pink-500 text-white rounded-lg text-xs cursor-pointer hover:bg-pink-600 active:bg-pink-700 font-medium">
                    🎵 Upload audio file
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => onContentChange(index, "url", ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>

                  {/* UPDATE THIS SECTION: Render the correct player */}
                  {block.url ? (
                    ytId ? (
                      <div className="rounded-xl overflow-hidden bg-black" style={{ aspectRatio: "16/9" }}>
                         <iframe
                          src={`https://www.youtube.com/embed/${ytId}?playsinline=1&rel=0&modestbranding=1&controls=1`}
                          style={{ width: "100%", height: "100%", border: "none" }}
                          title="YouTube Music"
                        />
                      </div>
                    ) : (
                      <RegularAudioPlayer url={block.url} accentColor={block.accentColor} />
                    )
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-1">Upload a file or paste a URL above</p>
                  )}
                  
                  {/* Progress-bar accent colour (Keep this code) */}
                  <div ref={accentPickerRef} className="flex items-center gap-2" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs text-gray-500 flex-1">Bar colour</span>
                    <div className="relative">
                      <button className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-gray-300 bg-white/80" onClick={(e) => { e.stopPropagation(); setShowAccentPicker((v) => !v); }}>
                        <span className="w-3.5 h-3.5 rounded-full border border-gray-300" style={{ backgroundColor: block.accentColor ?? "#ffffff" }} />
                        <span className="text-xs text-gray-600">Pick</span>
                      </button>
                      {showAccentPicker && (
                         <div className="absolute right-0 top-9 bg-white rounded-2xl shadow-2xl p-3 border" style={{ zIndex: 9999, minWidth: 200 }} onPointerDown={(e) => e.stopPropagation()}>
                           <HexColorPicker color={block.accentColor ?? "#ffffff"} onChange={handleAccentColorChange} />
                         </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs drop-shadow" style={{ color: mutedColor }}>🎵 {block.title}</p>
                  {/* UPDATE THIS SECTION TOO: For the non-editing view */}
                  {block.url ? (
                    ytId ? (
                      <div className="rounded-xl overflow-hidden bg-black" style={{ aspectRatio: "16/9" }}>
                         <iframe
                          src={`https://www.youtube-nocookie.com/embed/${ytId}?playsinline=1&rel=0&modestbranding=1&controls=1`}
                          style={{ width: "100%", height: "100%", border: "none" }}
                        />
                      </div>
                    ) : (
                      <RegularAudioPlayer url={block.url} accentColor={block.accentColor} />
                    )
                  ) : (
                    <p className="text-xs italic" style={{ color: mutedColor }}>No audio yet</p>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* ── VIDEO ── */}
        {block.type === "video" && (() => {
          const cardVisible = isEditing && isSelected;
          const cardStyle = cardVisible ? { backgroundColor: bgColor } : { backgroundColor: "transparent" };
          const cardClass  = cardVisible ? "p-3 rounded shadow-lg" : "p-1";

          return (
            <div className={cardClass} style={cardStyle}>
              {isEditing && isSelected ? (
                <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                  {/* URL input */}
                  <input
                    type="text"
                    value={block.url.startsWith("data:") ? "" : block.url}
                    onChange={(e) => onContentChange(index, "url", e.target.value)}
                    placeholder="YouTube / Vimeo URL or direct video link"
                    className="w-full p-1.5 border rounded text-xs bg-white/80"
                  />

                  {/* File upload */}
                  <label className="flex items-center justify-center gap-2 w-full px-3 py-2.5 bg-indigo-500 text-white rounded-lg text-xs cursor-pointer hover:bg-indigo-600 active:bg-indigo-700 font-medium">
                    🎬 Upload video file
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => onContentChange(index, "url", ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>

                  {/* Caption */}
                  <input
                    type="text"
                    value={block.caption || ""}
                    onChange={(e) => onContentChange(index, "caption", e.target.value)}
                    placeholder="Caption (optional)"
                    className="w-full p-1.5 border rounded text-xs bg-white/80"
                  />

                  {/* Live preview */}
                  {block.url && <VideoPlayer url={block.url} />}
                </div>
              ) : (
                <div>
                  {block.url ? (
                    <VideoPlayer url={block.url} />
                  ) : (
                    <div className="rounded-xl bg-black/20 flex items-center justify-center" style={{ aspectRatio: "16/9" }}>
                      <span className="text-2xl">🎬</span>
                    </div>
                  )}
                  {block.caption && (
                    <p className="text-xs mt-1 text-center" style={{ color: mutedColor }}>{block.caption}</p>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* ── BOOK TEXT ── */}
        {block.type === "bookText" && (
          <div className="p-3">
            {isEditing && isSelected ? (
              <textarea
                value={block.content}
                onChange={(e) => onContentChange(index, "content", e.target.value)}
                className="w-full bg-transparent border-none outline-none resize-none text-sm"
                style={{ color: textColor }}
                rows={3}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <p className="text-sm" style={{ color: textColor }}>{block.content}</p>
            )}
          </div>
        )}

        {/* ── NOTE ── */}
        {block.type === "note" && (
          <div className="p-3 rounded shadow-lg border-2" style={{ backgroundColor: bgColor, borderColor: darken(bgColor, 0.1) }}>
            {isEditing && isSelected ? (
              <textarea
                value={block.content}
                onChange={(e) => onContentChange(index, "content", e.target.value)}
                className="w-full bg-transparent border-none outline-none resize-none text-sm"
                style={{ color: textColor }}
                rows={3}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <p className="text-sm" style={{ color: textColor }}>{block.content}</p>
            )}
          </div>
        )}

        {/* ── BACKGROUND ── */}
        {block.type === "background" && (
          <textarea
            value={block.content}
            onChange={(e) => onContentChange(index, "content", e.target.value)}
            className="w-full h-full bg-transparent border-none outline-none resize-none text-sm p-4"
            style={{ color: textColor }}
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </div>
    </motion.div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Darkens a hex colour by `amount` (0–1) for borders / accents. */
function darken(hex: string, amount: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (n >> 16) - Math.round(255 * amount));
  const g = Math.max(0, ((n >> 8) & 0xff) - Math.round(255 * amount));
  const b = Math.max(0, (n & 0xff) - Math.round(255 * amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/** Returns black or white depending on which contrasts better with `hex`. */
function getContrastColor(hex: string): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#374151" : "#ffffff";
}

/** Detects a YouTube URL and returns the video ID, or null. */
function getYouTubeVideoId(url: string): string | null {
  const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
  if (watchMatch) return watchMatch[1];
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return shortMatch[1];
  const embedMatch = url.match(/youtube\.com\/embed\/([^?&]+)/);
  if (embedMatch) return embedMatch[1];
  return null;
}

/** Detects a Vimeo URL and returns the video ID, or null. */
function getVimeoVideoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Picks the right video renderer for a given URL:
 *  - YouTube  → native iframe (controls work on all mobile browsers)
 *  - Vimeo    → native iframe
 *  - anything else (including data: URLs from file upload) → <video> element
 */
function VideoPlayer({ url, className }: { url: string; className?: string }) {
  const ytId    = getYouTubeVideoId(url);
  const vimeoId = getVimeoVideoId(url);

  if (ytId) {
    return (
      <div
        className={`${className ?? ""} relative rounded-xl overflow-hidden bg-black`}
        style={{ aspectRatio: "16/9" }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${ytId}?playsinline=1&rel=0&modestbranding=1&controls=1`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={{ width: "100%", height: "100%", border: "none" }}
          title="YouTube video"
        />
      </div>
    );
  }

  if (vimeoId) {
    return (
      <div
        className={`${className ?? ""} relative rounded-xl overflow-hidden bg-black`}
        style={{ aspectRatio: "16/9" }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?playsinline=1&title=0&byline=0&portrait=0`}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          style={{ width: "100%", height: "100%", border: "none" }}
          title="Vimeo video"
        />
      </div>
    );
  }

  // Direct video file or data URL
  return (
    <video
      src={url}
      controls
      playsInline
      className={`${className ?? ""} rounded-xl w-full bg-black`}
      style={{ maxHeight: 220 }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    />
  );
}

/** Custom player for uploaded / direct-URL audio files. */
function RegularAudioPlayer({ url, className, accentColor }: { url: string; className?: string; accentColor?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onLoaded = () => setDuration(el.duration || 0);
    const onTime   = () => setCurrentTime(el.currentTime);
    const onPlay   = () => setIsPlaying(true);
    const onPause  = () => setIsPlaying(false);
    const onEnded  = () => { setIsPlaying(false); setCurrentTime(0); };
    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
    };
  }, [url]);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    isPlaying ? el.pause() : el.play();
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value);
    if (audioRef.current) audioRef.current.currentTime = t;
    setCurrentTime(t);
  };

  const fmt = (s: number) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${ss}`;
  };

  return (
    <div
      className={`${className ?? ""} rounded-2xl bg-black/10 backdrop-blur-sm px-3 pt-2 pb-1.5`}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Hidden real audio element */}
      <audio ref={audioRef} src={url} preload="metadata" style={{ display: "none" }} />

      {/* Play + seek bar */}
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); toggle(); }}
          className="w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center text-sm flex-shrink-0"
        >
          {isPlaying ? "⏸" : "▶️"}
        </button>
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={(e) => { e.stopPropagation(); seek(e); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="flex-1"
          style={{ accentColor: accentColor ?? "white", height: "4px", cursor: "pointer" }}
        />
      </div>

      {/* Timestamps below the bar */}
      <div className="flex justify-between mt-1 px-9">
        <span className="text-xs text-gray-600 font-mono">{fmt(currentTime)}</span>
        <span className="text-xs text-gray-600 font-mono">{duration ? fmt(duration) : "--:--"}</span>
      </div>
    </div>
  );
}