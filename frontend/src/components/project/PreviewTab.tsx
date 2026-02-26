import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Maximize,
  Minimize,
  Pause,
  Play,
  Image as ImageIcon,
} from "lucide-react";
import { useProjectUploads, UploadedImage } from "./ProjectUploadsContext";
import { useCustomization } from "./CustomizationContext";

type ViewerImage = { url: string; label: string; type: "upload" | "customized" };

const PreviewTab = () => {
  const { images } = useProjectUploads();
  const { customizedImages } = useCustomization();

  // Merge uploads + customized into one viewer list
  const allImages: ViewerImage[] = [
    ...images.map((i) => ({ url: i.preview, label: i.label, type: "upload" as const })),
    ...customizedImages.map((c) => ({
      url: c.url,
      label: `${c.sourceLabel} (${c.colorHex})`,
      type: "customized" as const,
    })),
  ];

  // Source filter
  const [showSource, setShowSource] = useState<"all" | "upload" | "customized">("all");
  const filtered =
    showSource === "all" ? allImages : allImages.filter((i) => i.type === showSource);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const dragStartX = useRef(0);
  const dragStartIndex = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clamp index
  const safeIndex = filtered.length > 0 ? activeIndex % filtered.length : 0;

  // Auto-rotation
  useEffect(() => {
    if (autoRotate && filtered.length > 1) {
      intervalRef.current = setInterval(() => {
        setActiveIndex((i) => (i + 1) % filtered.length);
      }, 120);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRotate, filtered.length]);

  // Drag handlers for 360 spin
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (filtered.length <= 1) return;
      setIsDragging(true);
      setAutoRotate(false);
      dragStartX.current = e.clientX;
      dragStartIndex.current = safeIndex;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [filtered.length, safeIndex]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || filtered.length <= 1) return;
      const dx = e.clientX - dragStartX.current;
      const sensitivity = 8; // pixels per frame
      const frameDelta = Math.round(dx / sensitivity);
      const newIndex =
        ((dragStartIndex.current + frameDelta) % filtered.length + filtered.length) %
        filtered.length;
      setActiveIndex(newIndex);
    },
    [isDragging, filtered.length]
  );

  const onPointerUp = useCallback(() => setIsDragging(false), []);

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!fullscreen) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setFullscreen(!fullscreen);
  };

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const next = () => setActiveIndex((i) => (i + 1) % filtered.length);
  const prev = () => setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length);
  const resetView = () => {
    setActiveIndex(0);
    setAutoRotate(false);
  };

  if (allImages.length === 0) {
    return (
      <div className="glass rounded-lg p-12 text-center" style={{ minHeight: 400 }}>
        <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-display font-semibold text-foreground mb-2">No images yet</h3>
        <p className="text-sm text-muted-foreground">
          Upload product images or generate customized versions to view them here.
        </p>
      </div>
    );
  }

  const current = filtered[safeIndex];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-display font-semibold text-foreground">360° Product Viewer</h3>
        <div className="flex items-center gap-2">
          {/* Source filter */}
          {customizedImages.length > 0 && (
            <div className="flex rounded-md border border-border overflow-hidden text-xs">
              {(["all", "upload", "customized"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setShowSource(s);
                    setActiveIndex(0);
                  }}
                  className={`px-3 py-1 capitalize transition-colors ${
                    showSource === s
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {s === "all" ? "All" : s === "upload" ? "Originals" : "Customized"}
                </button>
              ))}
            </div>
          )}
          <span className="font-mono text-xs text-muted-foreground">
            {safeIndex + 1}/{filtered.length}
          </span>
        </div>
      </div>

      {/* Viewer */}
      <div
        ref={containerRef}
        className={`glass rounded-lg overflow-hidden relative select-none ${
          fullscreen ? "bg-background" : ""
        }`}
        style={{ height: fullscreen ? "100vh" : 500, cursor: isDragging ? "grabbing" : "grab" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {current && (
          <img
            src={current.url}
            alt={current.label}
            className="w-full h-full object-contain bg-secondary/20 pointer-events-none"
            draggable={false}
          />
        )}

        {/* Nav arrows */}
        {filtered.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/60 hover:bg-background/80 backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/60 hover:bg-background/80 backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </>
        )}

        {/* Controls bar */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <div className="bg-background/70 backdrop-blur-sm rounded-md px-3 py-1.5 flex items-center gap-1">
            {current?.type === "customized" && (
              <Badge variant="secondary" className="text-[10px] mr-1 bg-primary/10 text-primary">
                Customized
              </Badge>
            )}
            <span className="font-mono text-xs text-foreground">{current?.label}</span>
          </div>
          <div className="flex items-center gap-1">
            {filtered.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-background/60 hover:bg-background/80 backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setAutoRotate(!autoRotate);
                }}
                title={autoRotate ? "Pause rotation" : "Auto-rotate"}
              >
                {autoRotate ? (
                  <Pause className="w-3.5 h-3.5" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-background/60 hover:bg-background/80 backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                resetView();
              }}
              title="Reset view"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-background/60 hover:bg-background/80 backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              title="Toggle fullscreen"
            >
              {fullscreen ? (
                <Minimize className="w-3.5 h-3.5" />
              ) : (
                <Maximize className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </div>

        {/* Drag hint */}
        {filtered.length > 1 && !isDragging && !autoRotate && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-background/60 backdrop-blur-sm rounded-full px-3 py-1 text-[10px] font-mono text-muted-foreground pointer-events-none">
            ← Drag to rotate →
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {filtered.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filtered.map((img, i) => (
            <button
              key={`${img.type}-${i}`}
              onClick={() => setActiveIndex(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all relative ${
                i === safeIndex
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border/50 hover:border-primary/40"
              }`}
            >
              <img
                src={img.url}
                alt={img.label}
                className="w-full h-full object-cover"
              />
              {img.type === "customized" && (
                <div className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-bl" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PreviewTab;
