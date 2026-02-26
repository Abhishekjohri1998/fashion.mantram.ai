import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface DeckSection {
  key: string;
  label: string;
  available: boolean;
  images?: { url: string; label: string }[];
}

export interface DeckSelections {
  sections: Record<string, boolean>;
  /** Per-section image selections: sectionKey → set of selected image urls */
  images: Record<string, Set<string>>;
}

interface DeckSectionSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: DeckSection[];
  onConfirm: (selections: DeckSelections) => void;
  title?: string;
}

const DeckSectionSelector = ({ open, onOpenChange, sections, onConfirm, title = "Select Deck Sections" }: DeckSectionSelectorProps) => {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [imageSelections, setImageSelections] = useState<Record<string, Set<string>>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Initialize all available sections as selected
  useEffect(() => {
    if (!open) return;
    const sel: Record<string, boolean> = {};
    const imgSel: Record<string, Set<string>> = {};
    sections.forEach((s) => {
      sel[s.key] = s.available;
      if (s.images?.length) {
        imgSel[s.key] = new Set(s.images.map((i) => i.url));
      }
    });
    setSelected(sel);
    setImageSelections(imgSel);
    setExpandedSections({});
  }, [open, sections]);

  const toggleSection = (key: string) => {
    setSelected((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // If unchecking section, clear its image selections; if checking, select all
      const section = sections.find((s) => s.key === key);
      if (section?.images?.length) {
        setImageSelections((prevImg) => ({
          ...prevImg,
          [key]: next[key] ? new Set(section.images!.map((i) => i.url)) : new Set(),
        }));
      }
      return next;
    });
  };

  const toggleImage = (sectionKey: string, url: string) => {
    setImageSelections((prev) => {
      const set = new Set(prev[sectionKey] || []);
      if (set.has(url)) {
        set.delete(url);
      } else {
        set.add(url);
      }
      // If no images selected, uncheck section; if some selected, ensure section checked
      setSelected((prevSel) => ({ ...prevSel, [sectionKey]: set.size > 0 }));
      return { ...prev, [sectionKey]: set };
    });
  };

  const toggleExpand = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selectAll = () => {
    const sel: Record<string, boolean> = {};
    const imgSel: Record<string, Set<string>> = {};
    sections.forEach((s) => {
      if (s.available) {
        sel[s.key] = true;
        if (s.images?.length) imgSel[s.key] = new Set(s.images.map((i) => i.url));
      }
    });
    setSelected(sel);
    setImageSelections(imgSel);
  };

  const deselectAll = () => {
    setSelected({});
    setImageSelections({});
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const availableCount = sections.filter((s) => s.available).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground">
            {selectedCount} of {availableCount} sections selected
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={selectAll}>
              Select All
            </Button>
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={deselectAll}>
              Deselect All
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 max-h-[50vh] pr-2">
          <div className="space-y-1">
            {sections.map((section) => {
              if (!section.available) return null;
              const hasImages = section.images && section.images.length > 0;
              const isExpanded = expandedSections[section.key];
              const imgSet = imageSelections[section.key];
              const selectedImgCount = imgSet?.size || 0;

              return (
                <div key={section.key} className="rounded-lg border border-border/50 overflow-hidden">
                  <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/30 transition-colors">
                    <Checkbox
                      id={section.key}
                      checked={!!selected[section.key]}
                      onCheckedChange={() => toggleSection(section.key)}
                    />
                    <Label htmlFor={section.key} className="flex-1 text-sm font-medium cursor-pointer">
                      {section.label}
                    </Label>
                    {hasImages && (
                      <Badge variant="secondary" className="text-[10px]">
                        {selectedImgCount}/{section.images!.length}
                      </Badge>
                    )}
                    {hasImages && (
                      <button onClick={() => toggleExpand(section.key)} className="p-0.5 text-muted-foreground hover:text-foreground">
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  {hasImages && isExpanded && (
                    <div className="px-3 pb-2.5 pt-1 border-t border-border/30 bg-muted/20">
                      <div className="grid grid-cols-3 gap-2">
                        {section.images!.map((img) => {
                          const isSelected = imgSet?.has(img.url) || false;
                          return (
                            <button
                              key={img.url}
                              onClick={() => toggleImage(section.key, img.url)}
                              className={`relative rounded-md overflow-hidden border-2 transition-all ${
                                isSelected
                                  ? "border-primary ring-1 ring-primary/30"
                                  : "border-border/50 opacity-50 hover:opacity-75"
                              }`}
                            >
                              <img
                                src={img.url}
                                alt={img.label}
                                className="w-full aspect-square object-cover"
                              />
                              <div className="absolute bottom-0 inset-x-0 bg-background/80 px-1 py-0.5">
                                <p className="text-[9px] truncate text-foreground">{img.label}</p>
                              </div>
                              {isSelected && (
                                <div className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                  <svg className="w-2.5 h-2.5 text-primary-foreground" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M2 6l3 3 5-5" />
                                  </svg>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="mt-3">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => onConfirm({ sections: selected, images: imageSelections })} disabled={selectedCount === 0}>
            Generate ({selectedCount} sections)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeckSectionSelector;
