import { useState, useCallback, useRef, useEffect } from "react";
import { BookCard } from "./BookCard";
import { ScrapbookBlock } from "./ScrapbookBlock";
import { HoldButton } from "./HoldButton";
import { CoverEditor } from "./CoverEditor";
import { HexColorPicker } from "react-colorful";
import { RotateCcw, RotateCw, Trash2, ArrowUp, ArrowDown, Palette } from "lucide-react";

type ContentBlock =
  | { type: "text";  content: string; x: number; y: number; width: number; rotation?: number; color?: string; zIndex?: number }
  | { type: "image"; url: string; caption?: string; x: number; y: number; width: number; rotation?: number; color?: string; zIndex?: number }
  | { type: "quote"; text: string; x: number; y: number; width: number; rotation?: number; color?: string; zIndex?: number }
  | { type: "music"; url: string; title: string; accentColor?: string; x: number; y: number; width: number; rotation?: number; color?: string; zIndex?: number }
  | { type: "video"; url: string; caption?: string; x: number; y: number; width: number; rotation?: number; color?: string; zIndex?: number };

interface Book {
  id: number;
  title: string;
  cover: string;
  colorTheme: string;
  canvasBg?: string;
  content: ContentBlock[];
}

const initialBooks: Book[] = [
  {
    id: 1,
    title: "The Midnight Library",
    cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80",
    colorTheme: "Midnight",
    content: [
      { type: "text",  content: "Between life and death there is a library...", x: 20,  y: 20,  width: 250, rotation: -2 },
      { type: "quote", text: "Would you have done anything different?",         x: 50,  y: 180, width: 220, rotation: 1  },
      { type: "image", url: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&q=80", caption: "A library of infinite possibilities", x: 120, y: 340, width: 200, rotation: -3 },
    ],
  },
  {
    id: 2,
    title: "Atomic Habits",
    cover: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&q=80",
    colorTheme: "Forest",
    content: [
      { type: "text",  content: "Habits are the compound interest of self-improvement.", x: 30, y: 40,  width: 240, rotation: 2  },
      { type: "quote", text: "You do not rise to the level of your goals. You fall to the level of your systems.", x: 60, y: 200, width: 250, rotation: -1 },
    ],
  },
  {
    id: 3,
    title: "The Silent Patient",
    cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80",
    colorTheme: "Crimson",
    content: [
      { type: "text",  content: "Alicia Berenson's life is seemingly perfect...", x: 40,  y: 30,  width: 220, rotation: -2 },
      { type: "image", url: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&q=80", caption: "The mystery begins", x: 100, y: 250, width: 180, rotation: 3 },
    ],
  },
  {
    id: 4,
    title: "Educated",
    cover: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80",
    colorTheme: "Dusk",
    content: [
      { type: "text",  content: "Tara was seventeen the first time she set foot in a classroom.", x: 25, y: 50,  width: 260, rotation: 1  },
      { type: "quote", text: "Everything I had worked for... to see more truths than those given to me by my father.", x: 70, y: 220, width: 230, rotation: -2 },
    ],
  },
];

export function BookStack() {
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [openBook, setOpenBook] = useState<Book | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<ContentBlock[]>([]);
  const [editedTitle, setEditedTitle] = useState("");
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  const [coverEditorOpen, setCoverEditorOpen] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(340);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [bgTab, setBgTab] = useState<"solid" | "gradient">("solid");
  const [gradFrom, setGradFrom] = useState("#667eea");
  const [gradTo, setGradTo] = useState("#764ba2");
  const [gradAngle, setGradAngle] = useState(135);
  const bgPickerRef = useRef<HTMLDivElement>(null);

  const pageScrollRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const canvasCallbackRef = useCallback((node: HTMLDivElement | null) => {
    (canvasRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    if (!node) return;
    const update = () => setCanvasWidth(node.offsetWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(node);
  }, []);

  const computeCanvasHeight = (blocks: ContentBlock[]) =>
    blocks.length === 0
      ? 560
      : Math.max(560, Math.max(...blocks.map((b) => b.y + 260)) + 160);

  const handleUpdateCover = (cover: string, colorTheme: string) => {
    setBooks((prev) => prev.map((book, i) => (i === 0 ? { ...book, cover, colorTheme } : book)));
  };

  const handleSwipe = (direction: "left" | "right") => {
    setBooks((prev) => {
      const next = [...prev];
      const moved = next.shift();
      if (moved) next.push(moved);
      return next;
    });
  };

  const handleOpenBook  = () => { setOpenBook(books[0]); setIsEditing(false); };
  const handleCloseBook = () => { setOpenBook(null);     setIsEditing(false); };

  const handleStartEdit = () => {
    if (openBook) {
      setEditedContent([...openBook.content]);
      setEditedTitle(openBook.title);
      setIsEditing(true);
      setSelectedBlockIndex(null);
    }
  };

  const handleSaveEdit = () => {
    if (openBook) {
      setBooks((prev) =>
        prev.map((b) => b.id === openBook.id ? { ...b, content: editedContent, title: editedTitle } : b)
      );
      setOpenBook({ ...openBook, content: editedContent, title: editedTitle });
      setIsEditing(false);
      setSelectedBlockIndex(null);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent([]);
    setSelectedBlockIndex(null);
  };

  const handleContentChange = (index: number, field: string, value: string) => {
    const next = [...editedContent];
    next[index] = field === "useUrl"
      ? { ...next[index], useUrl: value === "true" } as ContentBlock
      : { ...next[index], [field]: value } as ContentBlock;
    setEditedContent(next);
  };

  const handleBlockUpdate = (index: number, updates: Partial<ContentBlock>) => {
    const next = [...editedContent];
    next[index] = { ...next[index], ...updates } as ContentBlock;
    setEditedContent(next);
  };

  /** Swap the zIndex values of two blocks so layers shift one step at a time. */
  const handleSwapLayers = (indexA: number, indexB: number) => {
    const next = [...editedContent];
    const zA = next[indexA].zIndex ?? (indexA * 2 + 1);
    const zB = next[indexB].zIndex ?? (indexB * 2 + 1);
    next[indexA] = { ...next[indexA], zIndex: zB } as ContentBlock;
    next[indexB] = { ...next[indexB], zIndex: zA } as ContentBlock;
    setEditedContent(next);
  };

  const handleAddBlock = (type: ContentBlock["type"]) => {
    const nextY = editedContent.length === 0
      ? 20
      : Math.max(...editedContent.map((b) => b.y + 220));
    const randomX = Math.floor(Math.random() * Math.max(40, canvasWidth - 240));
    const rot = Math.floor(Math.random() * 10) - 5;

    let newBlock: ContentBlock;
    switch (type) {
      case "text":  newBlock = { type: "text",  content: "New note...",  x: randomX, y: nextY, width: 200, rotation: rot }; break;
      case "quote": newBlock = { type: "quote", text: "New quote...",   x: randomX, y: nextY, width: 220, rotation: rot }; break;
      case "image": newBlock = { type: "image", url: "", caption: "",   x: randomX, y: nextY, width: 180, rotation: rot }; break;
      case "music": newBlock = { type: "music", url: "", title: "New song", x: randomX, y: nextY, width: 220, rotation: rot }; break;
      case "video": newBlock = { type: "video", url: "", caption: "",   x: randomX, y: nextY, width: 240, rotation: rot }; break;
    }

    setEditedContent([...editedContent, newBlock]);
    requestAnimationFrame(() => {
      pageScrollRef.current?.scrollTo({ top: pageScrollRef.current.scrollHeight, behavior: "smooth" });
    });
  };

  const handleDeleteBlock = (index: number) => {
    setEditedContent(editedContent.filter((_, i) => i !== index));
    setSelectedBlockIndex(null);
  };

  const handleRotateBlock = (direction: "left" | "right") => {
    if (selectedBlockIndex === null) return;
    const block = editedContent[selectedBlockIndex];
    const cur = block.rotation ?? 0;
    handleBlockUpdate(selectedBlockIndex, { rotation: direction === "left" ? cur - 3 : cur + 3 });
  };

  /** Change the canvas background colour and persist it to the book immediately. */
  const handleCanvasBgChange = (color: string) => {
    if (!openBook) return;
    const updated = { ...openBook, canvasBg: color };
    setOpenBook(updated);
    setBooks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  };

  /** Close bg picker when tapping outside. */
  useEffect(() => {
    if (!showBgPicker) return;
    const handler = (e: PointerEvent) => {
      if (bgPickerRef.current && !bgPickerRef.current.contains(e.target as Node)) {
        setShowBgPicker(false);
      }
    };
    window.addEventListener("pointerdown", handler);
    return () => window.removeEventListener("pointerdown", handler);
  }, [showBgPicker]);

  if (openBook) {
    const displayBlocks = isEditing ? editedContent : openBook.content;
    const canvasHeight = computeCanvasHeight(displayBlocks);

    return (
      <div ref={pageScrollRef} className="relative w-full h-full bg-amber-50 overflow-y-auto">
        <div className="max-w-xl mx-auto p-4">

          {/* Top nav */}
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={handleCloseBook}
              className="flex items-center gap-2 text-gray-700 active:scale-95 transition-transform"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to library
            </button>
            {!isEditing && (
              <button
                onClick={handleStartEdit}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm active:scale-95 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            )}
          </div>

          {/* Book card */}
          <div className="bg-white rounded-xl shadow-lg p-5 mb-8">

            {/* Book header */}
            <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-200">
              <img src={openBook.cover} alt={openBook.title} className="w-20 h-28 object-cover rounded-md shadow-md flex-shrink-0" />
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="w-full text-xl mb-1 font-serif border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <h1 className="text-xl mb-1 font-serif">{openBook.title}</h1>
                )}
              </div>
            </div>

            {/* Scrapbook area */}
            <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4">

              {/* Header row: title + background colour picker */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-serif text-gray-700">My Yarnbook</h3>

                {/* Background colour swatch + popover */}
                <div ref={bgPickerRef} className="relative" onPointerDown={(e) => e.stopPropagation()}>
                  <button
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-gray-300 shadow-sm bg-white/80 active:scale-95 transition-transform"
                    onClick={() => setShowBgPicker((v) => !v)}
                    title="Change canvas background colour"
                  >
                    {/* Live preview dot */}
                    <span
                      className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                      style={{ background: openBook.canvasBg ?? "#ffffff" }}
                    />
                    <Palette size={12} className="text-gray-500" />
                  </button>

                  {showBgPicker && (() => {
                    const GRADIENT_PRESETS = [
                      "linear-gradient(135deg,#667eea,#764ba2)",
                      "linear-gradient(135deg,#f093fb,#f5576c)",
                      "linear-gradient(135deg,#4facfe,#00f2fe)",
                      "linear-gradient(135deg,#43e97b,#38f9d7)",
                      "linear-gradient(135deg,#fa709a,#fee140)",
                      "linear-gradient(135deg,#a18cd1,#fbc2eb)",
                      "linear-gradient(135deg,#fccb90,#d57eeb)",
                      "linear-gradient(135deg,#30cfd0,#330867)",
                      "linear-gradient(135deg,#0f2027,#203a43,#2c5364)",
                      "linear-gradient(135deg,#1a1a2e,#0f3460)",
                      "radial-gradient(circle at 30% 30%,#f9d423,#ff4e50)",
                      "radial-gradient(ellipse at bottom,#1b2735,#090a0f)",
                    ];
                    const customGrad = `linear-gradient(${gradAngle}deg,${gradFrom},${gradTo})`;
                    return (
                      <div
                        className="absolute right-0 top-10 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                        style={{ zIndex: 9999, width: 248 }}
                      >
                        {/* Tabs */}
                        <div className="flex border-b border-gray-100">
                          {(["solid","gradient"] as const).map((t) => (
                            <button
                              key={t}
                              className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${bgTab === t ? "bg-gray-50 text-gray-800 border-b-2 border-blue-500" : "text-gray-400 hover:text-gray-600"}`}
                              onClick={() => setBgTab(t)}
                            >{t}</button>
                          ))}
                        </div>

                        <div className="p-3">
                          {bgTab === "solid" ? (
                            <>
                              <HexColorPicker
                                color={/^#/.test(openBook.canvasBg ?? "") ? (openBook.canvasBg ?? "#ffffff") : "#ffffff"}
                                onChange={handleCanvasBgChange}
                              />
                              {/* Solid presets */}
                              <div className="mt-3 grid grid-cols-6 gap-1.5">
                                {["#ffffff","#fef9c3","#f3e8ff","#dbeafe","#dcfce7","#fce7f3",
                                  "#1e1b4b","#0f172a","#fef3c7","#fce7f3","#fff1f2","#f1f5f9"].map((c) => (
                                  <button
                                    key={c}
                                    className="w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 active:scale-95"
                                    style={{ backgroundColor: c, borderColor: openBook.canvasBg === c ? "#3b82f6" : "#d1d5db" }}
                                    onClick={() => handleCanvasBgChange(c)}
                                  />
                                ))}
                              </div>
                              <div className="mt-2 flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0" style={{ background: openBook.canvasBg ?? "#ffffff" }} />
                                <span className="text-xs text-gray-400 font-mono">{openBook.canvasBg ?? "#ffffff"}</span>
                              </div>
                            </>
                          ) : (
                            <>
                              {/* Gradient preset grid */}
                              <p className="text-xs text-gray-400 mb-2 font-medium">Presets</p>
                              <div className="grid grid-cols-4 gap-1.5">
                                {GRADIENT_PRESETS.map((g) => (
                                  <button
                                    key={g}
                                    className="h-10 rounded-lg border-2 transition-transform hover:scale-105 active:scale-95"
                                    style={{ background: g, borderColor: openBook.canvasBg === g ? "#3b82f6" : "transparent" }}
                                    onClick={() => handleCanvasBgChange(g)}
                                  />
                                ))}
                              </div>

                              {/* Custom gradient builder */}
                              <p className="text-xs text-gray-400 mt-3 mb-2 font-medium">Custom</p>

                              {/* Live preview */}
                              <div
                                className="w-full h-8 rounded-lg mb-2 border border-gray-200"
                                style={{ background: customGrad }}
                              />

                              {/* From / To colour stops */}
                              <div className="flex gap-2 mb-2">
                                <label className="flex-1 flex flex-col gap-1">
                                  <span className="text-[10px] text-gray-400 uppercase tracking-wide">From</span>
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="color"
                                      value={gradFrom}
                                      onChange={(e) => {
                                        setGradFrom(e.target.value);
                                        handleCanvasBgChange(`linear-gradient(${gradAngle}deg,${e.target.value},${gradTo})`);
                                      }}
                                      className="w-7 h-7 rounded cursor-pointer border border-gray-200"
                                    />
                                    <span className="text-xs font-mono text-gray-500">{gradFrom}</span>
                                  </div>
                                </label>
                                <label className="flex-1 flex flex-col gap-1">
                                  <span className="text-[10px] text-gray-400 uppercase tracking-wide">To</span>
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="color"
                                      value={gradTo}
                                      onChange={(e) => {
                                        setGradTo(e.target.value);
                                        handleCanvasBgChange(`linear-gradient(${gradAngle}deg,${gradFrom},${e.target.value})`);
                                      }}
                                      className="w-7 h-7 rounded cursor-pointer border border-gray-200"
                                    />
                                    <span className="text-xs font-mono text-gray-500">{gradTo}</span>
                                  </div>
                                </label>
                              </div>

                              {/* Angle quick-picks */}
                              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Angle</p>
                              <div className="flex gap-1 flex-wrap">
                                {[0,45,90,135,180,225,270,315].map((a) => (
                                  <button
                                    key={a}
                                    className={`px-1.5 py-0.5 rounded text-xs border transition-colors ${gradAngle === a ? "bg-blue-500 text-white border-blue-500" : "border-gray-200 text-gray-500 hover:border-gray-400"}`}
                                    onClick={() => {
                                      setGradAngle(a);
                                      handleCanvasBgChange(`linear-gradient(${a}deg,${gradFrom},${gradTo})`);
                                    }}
                                  >{a}°</button>
                                ))}
                              </div>

                              <button
                                className="mt-2 w-full py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors"
                                onClick={() => handleCanvasBgChange(customGrad)}
                              >Apply custom gradient</button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Canvas — infinite vertical scroll */}
              <div
                ref={canvasCallbackRef}
                className="relative w-full rounded shadow-inner overflow-visible transition-colors duration-300"
                style={{ height: canvasHeight, background: openBook.canvasBg ?? "#ffffff" }}
                onClick={() => isEditing && setSelectedBlockIndex(null)}
                onPointerDown={() => {
                  if (!isEditing) return;
                  const root = document.documentElement;
                  root.style.userSelect = "none";
                  const restore = () => {
                    root.style.userSelect = "";
                    window.removeEventListener("pointerup", restore);
                    window.removeEventListener("pointercancel", restore);
                  };
                  window.addEventListener("pointerup", restore);
                  window.addEventListener("pointercancel", restore);
                }}
              >
                {displayBlocks.map((block, idx) => (
                  <ScrapbookBlock
                    key={idx}
                    block={block}
                    index={idx}
                    isEditing={isEditing}
                    isSelected={isEditing && selectedBlockIndex === idx}
                    canvasWidth={canvasWidth}
                    onSelect={setSelectedBlockIndex}
                    onUpdate={handleBlockUpdate}
                    onDelete={handleDeleteBlock}
                    onContentChange={handleContentChange}
                  />
                ))}

                {/* Toolbar — rendered outside the block's motion.div so it never moves during drag */}
                {isEditing && selectedBlockIndex !== null && (() => {
                  const b = editedContent[selectedBlockIndex];
                  if (!b) return null;
                  // Pin the toolbar just above the block's stored position
                  const toolbarX = Math.min(
                    Math.max(b.x + b.width / 2, 56),
                    canvasWidth - 56
                  );
                  const toolbarY = Math.max(b.y - 52, 8);
                  return (
                    <div
                      className="absolute flex items-center gap-2"
                      style={{
                        left: toolbarX,
                        top: toolbarY,
                        transform: "translateX(-50%)",
                        zIndex: 9999,
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <HoldButton
                        onHold={() => handleRotateBlock("left")}
                        className="w-9 h-9 rounded-full bg-white border border-gray-200 shadow-lg flex items-center justify-center active:bg-purple-100 transition-colors"
                      >
                        <RotateCcw size={15} className="text-purple-600" />
                      </HoldButton>

                      <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); handleDeleteBlock(selectedBlockIndex); }}
                        className="w-9 h-9 rounded-full bg-white border border-gray-200 shadow-lg flex items-center justify-center active:bg-red-100 transition-colors"
                      >
                        <Trash2 size={15} className="text-red-500" />
                      </button>

                      <HoldButton
                        onHold={() => handleRotateBlock("right")}
                        className="w-9 h-9 rounded-full bg-white border border-gray-200 shadow-lg flex items-center justify-center active:bg-purple-100 transition-colors"
                      >
                        <RotateCw size={15} className="text-purple-600" />
                      </HoldButton>

                      {/* Layer controls — step forward / backward with rank display */}
                      {(() => {
                        // Sort all blocks by effective zIndex to get rank (1 = back, N = front)
                        const sorted = editedContent
                          .map((bl, i) => ({ i, z: bl.zIndex ?? (i * 2 + 1) }))
                          .sort((a, b) => a.z - b.z || a.i - b.i);
                        const myRank  = sorted.findIndex(item => item.i === selectedBlockIndex); // 0-based
                        const total   = sorted.length;
                        const above   = sorted[myRank + 1]; // block one layer above
                        const below   = sorted[myRank - 1]; // block one layer below

                        return (
                          <div className="flex items-center rounded-full bg-white border border-gray-200 shadow-lg overflow-hidden">
                            {/* Up — swap with next block above */}
                            <button
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (above !== undefined) handleSwapLayers(selectedBlockIndex, above.i);
                              }}
                              disabled={above === undefined}
                              className="w-8 h-9 flex items-center justify-center transition-colors border-r border-gray-200 disabled:opacity-30 active:bg-blue-100"
                              title="Bring forward one layer"
                            >
                              <ArrowUp size={13} className="text-blue-600" />
                            </button>

                            {/* Layer rank label */}
                            <div className="px-2 h-9 flex flex-col items-center justify-center min-w-[38px]">
                              <span className="text-[10px] leading-none text-gray-400 uppercase tracking-wide">Layer</span>
                              <span className="text-[13px] leading-none text-gray-700 font-semibold mt-0.5">
                                {myRank + 1}<span className="text-gray-400 font-normal">/{total}</span>
                              </span>
                            </div>

                            {/* Down — swap with next block below */}
                            <button
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (below !== undefined) handleSwapLayers(selectedBlockIndex, below.i);
                              }}
                              disabled={below === undefined}
                              className="w-8 h-9 flex items-center justify-center transition-colors border-l border-gray-200 disabled:opacity-30 active:bg-blue-100"
                              title="Send backward one layer"
                            >
                              <ArrowDown size={13} className="text-blue-600" />
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })()}

                {/* Bottom fade hint */}
                {displayBlocks.length > 0 && (
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
                    <div className="flex flex-col items-center gap-1 opacity-20">
                      <div className="w-6 h-[1px] bg-gray-400" />
                      <span className="text-[9px] text-gray-400 tracking-widest uppercase">scroll</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Add-block toolbar + save/cancel */}
              {isEditing && (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleAddBlock("text")}  className="px-3 py-3 bg-yellow-200 text-yellow-800 rounded-lg text-sm active:bg-yellow-300 shadow font-medium">📝 Add Note</button>
                    <button onClick={() => handleAddBlock("quote")} className="px-3 py-3 bg-purple-200 text-purple-800 rounded-lg text-sm active:bg-purple-300 shadow font-medium">💭 Add Quote</button>
                    <button onClick={() => handleAddBlock("image")} className="px-3 py-3 bg-blue-200 text-blue-800 rounded-lg text-sm active:bg-blue-300 shadow font-medium">🖼️ Add Image</button>
                    <button onClick={() => handleAddBlock("music")} className="px-3 py-3 bg-pink-200 text-pink-800 rounded-lg text-sm active:bg-pink-300 shadow font-medium">🎵 Add Music</button>
                    <button onClick={() => handleAddBlock("video")} className="col-span-2 px-3 py-3 bg-indigo-200 text-indigo-800 rounded-lg text-sm active:bg-indigo-300 shadow font-medium">🎬 Add Video</button>
                  </div>
                  <p className="text-xs text-gray-500 text-center">Tap a block to select · Hold ↺↻ to rotate · 🗑 to delete</p>
                  <div className="flex gap-3">
                    <button onClick={handleSaveEdit}   className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium active:bg-green-700 shadow">Save Scrapbook</button>
                    <button onClick={handleCancelEdit} className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-medium active:bg-gray-400 shadow">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-purple-300/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm px-6">
        <div className="relative h-[550px] flex items-center">
          {books.slice(0, 4).map((book, index) => (
            <BookCard
              key={`${book.id}-${index}`}
              {...book}
              index={index}
              onSwipe={handleSwipe}
              onOpen={handleOpenBook}
              onEditCover={index === 0 ? () => setCoverEditorOpen(true) : undefined}
              isTop={index === 0}
            />
          ))}
        </div>

        <div className="mt-6 text-center text-gray-700">
          <p className="text-sm font-medium">Swipe to browse your library</p>
          <p className="text-xs text-gray-500 mt-1">Tap "Open Book" to start reading</p>
        </div>
      </div>

      {coverEditorOpen && (
        <CoverEditor
          book={books[0]}
          onSave={handleUpdateCover}
          onClose={() => setCoverEditorOpen(false)}
        />
      )}
    </div>
  );
}