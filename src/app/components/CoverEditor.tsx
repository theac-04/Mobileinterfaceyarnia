import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Upload, Link2, Check, ImageIcon, Grid2x2, Pipette } from "lucide-react";
import { HexColorPicker, HexColorInput } from "react-colorful";
import { BOOK_THEMES, getTheme } from "./bookThemes";

const BROWSE_PHOTOS = [
  { url: "https://images.unsplash.com/photo-1672713405678-2af2453b4213?w=400&q=80", label: "Abstract" },
  { url: "https://images.unsplash.com/photo-1636546055867-0cc0d3fed34d?w=400&q=80", label: "Forest" },
  { url: "https://images.unsplash.com/photo-1572968317323-8243a73bb697?w=400&q=80", label: "Ocean" },
  { url: "https://images.unsplash.com/photo-1774366126885-bef99f2f6d81?w=400&q=80", label: "Vintage" },
  { url: "https://images.unsplash.com/photo-1693069311980-5c1110c3dc91?w=400&q=80", label: "Botanical" },
  { url: "https://images.unsplash.com/photo-1695819685847-8e8afb30b4aa?w=400&q=80", label: "City Night" },
  { url: "https://images.unsplash.com/photo-1683221704109-acdeb0883037?w=400&q=80", label: "Mountains" },
  { url: "https://images.unsplash.com/photo-1756363211626-98f5a39bfbb4?w=400&q=80", label: "Marble" },
  { url: "https://images.unsplash.com/photo-1766008596001-5fbe283bed0a?w=400&q=80", label: "Cosy" },
  { url: "https://images.unsplash.com/photo-1596546326222-e1c110f39592?w=400&q=80", label: "Galaxy" },
  { url: "https://images.unsplash.com/photo-1637093932837-4ada3f6d4f6d?w=400&q=80", label: "Autumn" },
  { url: "https://images.unsplash.com/photo-1629946524864-d603024648fc?w=400&q=80", label: "Architecture" },
];

type Tab = "browse" | "url" | "upload";

interface CoverEditorProps {
  book: { title: string; cover: string; colorTheme: string };
  onSave: (cover: string, colorTheme: string) => void;
  onClose: () => void;
}

/** True if value is a hex color rather than a named preset. */
const isCustomHex = (v: string | undefined): boolean => Boolean(v?.startsWith("#"));

export function CoverEditor({ book, onSave, onClose }: CoverEditorProps) {
  const [tab, setTab] = useState<Tab>("browse");
  const [imageUrl, setImageUrl] = useState(book.cover);
  const [selectedTheme, setSelectedTheme] = useState(book.colorTheme);
  const [previewError, setPreviewError] = useState(false);

  // Custom colour picker state
  const [showPicker, setShowPicker] = useState(isCustomHex(book.colorTheme));
  const [customHex, setCustomHex] = useState(
    isCustomHex(book.colorTheme) ? book.colorTheme : "#7c3aed"
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const theme = getTheme(selectedTheme);

  const selectPhoto = (url: string) => { setImageUrl(url); setPreviewError(false); };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setImageUrl(ev.target?.result as string); setPreviewError(false); };
    reader.readAsDataURL(file);
  };

  const handlePresetClick = (name: string) => {
    setSelectedTheme(name);
    setShowPicker(false);
  };

  const handleCustomToggle = () => {
    const next = !showPicker;
    setShowPicker(next);
    if (next) setSelectedTheme(customHex);
  };

  const handleCustomHexChange = (hex: string) => {
    setCustomHex(hex);
    setSelectedTheme(hex);
  };

  const handleSave = () => { onSave(imageUrl, selectedTheme); onClose(); };

  const customIsActive = isCustomHex(selectedTheme);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div className="absolute inset-0 bg-black/60" onClick={onClose} />

        <motion.div
          className="relative w-full bg-white rounded-t-3xl shadow-2xl"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
            <h2 className="font-serif text-lg text-gray-900">Customise Cover</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200 transition-colors"
            >
              <X size={15} className="text-gray-600" />
            </button>
          </div>

          <div className="overflow-y-auto max-h-[78vh] pb-10">

            {/* Live preview */}
            <div className="flex justify-center py-5 border-b border-gray-100">
              <div className="flex items-stretch" style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.3))" }}>
                <div className="flex items-center justify-center rounded-l-sm" style={{ width: 14, background: theme.spine }}>
                  <div className="w-[2px] h-4/5 opacity-20 bg-white" />
                </div>
                <div
                  className="relative overflow-hidden"
                  style={{ width: 90, height: 128, background: `linear-gradient(160deg, ${theme.coverTop}, ${theme.coverBottom})` }}
                >
                  {imageUrl && !previewError && (
                    <img src={imageUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.5 }} onError={() => setPreviewError(true)} />
                  )}
                  <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 40%, ${theme.coverBottom}dd)` }} />
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="font-serif leading-tight truncate" style={{ color: theme.text, fontSize: 9 }}>{book.title}</p>
                  </div>
                </div>
                <div className="flex flex-col rounded-r-sm overflow-hidden" style={{ width: 4 }}>
                  {[...Array(32)].map((_, i) => (
                    <div key={i} style={{ flex: 1, background: i % 2 === 0 ? "#f0ece4" : "#e8e4dc", borderBottom: "0.5px solid #d8d4cc" }} />
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-5 space-y-6">

              {/* ── Cover Photo ── */}
              <div>
                <p className="text-sm font-medium text-gray-800 mb-3">Cover Photo</p>

                <div className="flex bg-gray-100 rounded-xl p-1 mb-4 gap-1">
                  {([
                    { id: "browse", icon: <Grid2x2 size={13} />, label: "Browse" },
                    { id: "url",    icon: <Link2 size={13} />,   label: "URL" },
                    { id: "upload", icon: <Upload size={13} />,  label: "Upload" },
                  ] as { id: Tab; icon: React.ReactNode; label: string }[]).map(({ id, icon, label }) => (
                    <button
                      key={id}
                      onClick={() => setTab(id)}
                      className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs transition-all ${tab === id ? "bg-white shadow text-gray-900" : "text-gray-400"}`}
                    >
                      {icon} {label}
                    </button>
                  ))}
                </div>

                {tab === "browse" && (
                  <div className="grid grid-cols-3 gap-2">
                    {BROWSE_PHOTOS.map((photo) => {
                      const selected = imageUrl === photo.url;
                      return (
                        <button
                          key={photo.url}
                          onClick={() => selectPhoto(photo.url)}
                          className="relative aspect-[2/3] rounded-xl overflow-hidden active:scale-95 transition-transform"
                          style={{ outline: selected ? "3px solid #7c3aed" : "3px solid transparent", outlineOffset: 2 }}
                        >
                          <img src={photo.url} alt={photo.label} className="w-full h-full object-cover" />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent pt-4 pb-1.5 px-1.5">
                            <span className="text-white text-[9px] leading-none">{photo.label}</span>
                          </div>
                          {selected && (
                            <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                              <Check size={11} className="text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {tab === "url" && (
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => { setImageUrl(e.target.value); setPreviewError(false); }}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-50"
                  />
                )}

                {tab === "upload" && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-200 rounded-xl py-8 flex flex-col items-center gap-2 active:bg-gray-50 transition-colors"
                  >
                    <ImageIcon size={28} className="text-gray-300" />
                    <span className="text-sm text-gray-400">Tap to choose from your photos</span>
                    {imageUrl && imageUrl.startsWith("data:") && (
                      <span className="text-xs text-green-600">✓ Photo selected</span>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </button>
                )}
              </div>

              {/* ── Colour ── */}
              <div>
                <p className="text-sm font-medium text-gray-800 mb-3">Colour</p>

                {/* Preset swatches + custom button */}
                <div className="grid grid-cols-4 gap-3 mb-3">
                  {BOOK_THEMES.map((t) => {
                    const selected = selectedTheme === t.name;
                    return (
                      <button
                        key={t.name}
                        onClick={() => handlePresetClick(t.name)}
                        className="flex flex-col items-center gap-1.5"
                      >
                        <div
                          className="rounded-full flex items-center justify-center transition-transform active:scale-90"
                          style={{
                            width: 48, height: 48,
                            background: `linear-gradient(135deg, ${t.coverTop}, ${t.coverBottom})`,
                            outline: selected ? `3px solid ${t.accent}` : "3px solid transparent",
                            outlineOffset: 2,
                          }}
                        >
                          {selected && <Check size={15} style={{ color: t.accent }} />}
                        </div>
                        <span className="text-[10px] text-gray-500 leading-tight text-center">{t.name}</span>
                      </button>
                    );
                  })}

                  {/* Custom colour button */}
                  <button onClick={handleCustomToggle} className="flex flex-col items-center gap-1.5">
                    <div
                      className="rounded-full flex items-center justify-center transition-transform active:scale-90 relative overflow-hidden"
                      style={{
                        width: 48, height: 48,
                        background: customIsActive
                          ? `linear-gradient(135deg, ${customHex}cc, ${customHex})`
                          : "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)",
                        outline: customIsActive ? `3px solid ${customHex}` : "3px solid transparent",
                        outlineOffset: 2,
                      }}
                    >
                      {customIsActive
                        ? <Check size={15} className="text-white drop-shadow" />
                        : <Pipette size={15} className="text-white drop-shadow" />
                      }
                    </div>
                    <span className="text-[10px] text-gray-500 leading-tight text-center">Custom</span>
                  </button>
                </div>

                {/* Inline colour picker — slides in when custom is active */}
                <AnimatePresence>
                  {showPicker && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-100">
                        {/* react-colorful picker */}
                        <div className="flex justify-center">
                          <HexColorPicker
                            color={customHex}
                            onChange={handleCustomHexChange}
                            style={{ width: "100%", height: 200 }}
                          />
                        </div>

                        {/* Hex input */}
                        <div className="flex items-center gap-2">
                          {/* colour preview dot */}
                          <div className="w-8 h-8 rounded-lg flex-shrink-0 border border-gray-200" style={{ background: customHex }} />
                          <div className="flex-1 flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white">
                            <span className="px-3 text-gray-400 text-sm select-none">#</span>
                            <HexColorInput
                              color={customHex}
                              onChange={handleCustomHexChange}
                              prefixed={false}
                              className="flex-1 py-2.5 pr-3 text-sm text-gray-800 bg-transparent focus:outline-none uppercase tracking-widest"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Save */}
              <button
                onClick={handleSave}
                className="w-full py-4 rounded-2xl font-medium text-sm tracking-wide transition-opacity active:opacity-80"
                style={{ background: theme.coverTop, color: theme.accent }}
              >
                Save Cover
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}