import { motion } from "motion/react";
import { Pencil } from "lucide-react";
import { getTheme } from "./bookThemes";

interface BookCardProps {
  title: string;
  cover: string;
  colorTheme: string;
  index: number;
  onSwipe: (direction: "left" | "right") => void;
  onOpen: () => void;
  onEditCover?: () => void;
  isTop: boolean;
}

export function BookCard({
  title,
  cover,
  colorTheme,
  index,
  onSwipe,
  onOpen,
  onEditCover,
  isTop,
}: BookCardProps) {
  const theme = getTheme(colorTheme);

  const handleDragEnd = (_: any, info: any) => {
    const threshold = 80;
    if (info.offset.x > threshold) onSwipe("right");
    else if (info.offset.x < -threshold) onSwipe("left");
  };

  return (
    <motion.div
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={{
        x: index * 20,
        y: index * 8,
        scale: 1 - index * 0.04,
        opacity: 1 - index * 0.15,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="absolute w-full"
      style={{ zIndex: 10 - index, pointerEvents: isTop ? "auto" : "none" }}
    >
      <div className="flex" style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.45))" }}>

        {/* ── Spine ── */}
        <div
          className="flex-shrink-0 flex items-center justify-center rounded-l-sm relative overflow-hidden"
          style={{ width: 28, background: theme.spine }}
        >
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-white/10" />
          <span
            className="font-serif text-[11px] tracking-widest select-none"
            style={{
              color: theme.accent,
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              opacity: 0.85,
              maxHeight: "90%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </span>
        </div>

        {/* ── Main Cover ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Artwork area */}
          <div className="relative overflow-hidden" style={{ height: 320 }}>
            <img
              src={cover}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: 0.55 }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(160deg, ${theme.coverTop}cc 0%, ${theme.coverTop}88 60%, transparent 100%)`,
              }}
            />
            <div
              className="absolute bottom-0 left-0 right-0 h-24"
              style={{ background: `linear-gradient(to bottom, transparent, ${theme.coverBottom})` }}
            />

            {/* Decorative lines */}
            <div className="absolute top-4 left-4 flex flex-col gap-[3px]">
              <div className="h-[1px] w-8"  style={{ background: theme.accent, opacity: 0.6 }} />
              <div className="h-[1px] w-14" style={{ background: theme.accent, opacity: 0.35 }} />
            </div>

            {/* Edit cover button — only on the top card */}
            {isTop && onEditCover && (
              <button
                onClick={(e) => { e.stopPropagation(); onEditCover(); }}
                className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full active:opacity-70 transition-opacity"
                style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
              >
                <Pencil size={11} color="white" />
                <span className="text-white text-[11px] tracking-wide">Edit cover</span>
              </button>
            )}
          </div>

          {/* Solid lower section */}
          <div
            className="flex flex-col justify-end px-5 pt-4 pb-5"
            style={{ background: theme.coverBottom, minHeight: 110 }}
          >
            <div className="mb-3 h-[1px] w-10" style={{ background: theme.accent, opacity: 0.5 }} />
            <h2 className="font-serif leading-tight mb-1" style={{ color: theme.text, fontSize: 20 }}>
              {title}
            </h2>
            <div className="flex gap-1 mt-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-full" style={{ width: 4, height: 4, background: theme.accent, opacity: 0.5 }} />
              ))}
            </div>
          </div>

          {/* Open Book button */}
          <button
            onClick={(e) => { e.stopPropagation(); onOpen(); }}
            className="w-full py-3 font-medium text-sm tracking-wide transition-all active:scale-95"
            style={{ background: theme.spine, color: theme.accent, borderTop: `1px solid ${theme.accent}22` }}
          >
            Open Book
          </button>
        </div>

        {/* ── Page edges ── */}
        <div className="flex-shrink-0 flex flex-col justify-center rounded-r-sm overflow-hidden" style={{ width: 6 }}>
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              style={{
                height: "2.5%",
                background: i % 2 === 0 ? "#f0ece4" : "#e8e4dc",
                borderBottom: "0.5px solid #d8d4cc",
              }}
            />
          ))}
        </div>

      </div>
    </motion.div>
  );
}
