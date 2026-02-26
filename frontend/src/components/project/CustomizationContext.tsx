import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "@/lib/api";

export interface CustomizedImage {
  sourceLabel: string;
  url: string;
  colorHex: string;
  materialLabel: string;
  dbId?: string;
}

export interface LifestyleImage {
  sourceLabel: string;
  url: string;
  dbId?: string;
}

export interface GradedSize {
  size: string;
  sizeNum: number;
  measurements: Record<string, number>;
}

interface CustomizationContextType {
  customizedImages: CustomizedImage[];
  addCustomizedImage: (img: CustomizedImage) => void;
  removeCustomizedImage: (idx: number) => void;
  clearCustomizedImages: () => void;
  lifestyleImages: LifestyleImage[];
  addLifestyleImage: (img: LifestyleImage) => void;
  removeLifestyleImage: (idx: number) => void;
  gradedSizes: GradedSize[];
  setGradedSizes: (sizes: GradedSize[]) => void;
  addGradedSize: (size: GradedSize) => void;
  moodBoardUrl: string | null;
  setMoodBoardUrl: (url: string | null) => void;
  saveMoodBoard: (url: string) => void;
  removeMoodBoard: () => void;
  customizedDrawings: Record<number, string>;
  setCustomizedDrawings: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  saveCustomizedDrawing: (idx: number, url: string) => void;
  removeCustomizedDrawing: (idx: number) => void;
}

const CustomizationContext = createContext<CustomizationContextType>({
  customizedImages: [],
  addCustomizedImage: () => { },
  removeCustomizedImage: () => { },
  clearCustomizedImages: () => { },
  lifestyleImages: [],
  addLifestyleImage: () => { },
  removeLifestyleImage: () => { },
  gradedSizes: [],
  setGradedSizes: () => { },
  addGradedSize: () => { },
  moodBoardUrl: null,
  setMoodBoardUrl: () => { },
  saveMoodBoard: () => { },
  removeMoodBoard: () => { },
  customizedDrawings: {},
  setCustomizedDrawings: () => { },
  saveCustomizedDrawing: () => { },
  removeCustomizedDrawing: () => { },
});

export const useCustomization = () => useContext(CustomizationContext);

export const CustomizationProvider = ({ children, projectId }: { children: ReactNode; projectId: string }) => {
  const [customizedImages, setCustomizedImages] = useState<CustomizedImage[]>([]);
  const [lifestyleImages, setLifestyleImages] = useState<LifestyleImage[]>([]);
  const [gradedSizes, setGradedSizes] = useState<GradedSize[]>([]);
  const [moodBoardUrl, setMoodBoardUrl] = useState<string | null>(null);
  const [customizedDrawings, setCustomizedDrawings] = useState<Record<number, string>>({});
  const [drawingDbIds, setDrawingDbIds] = useState<Record<number, string>>({});
  const [moodBoardDbId, setMoodBoardDbId] = useState<string | null>(null);

  // Load saved assets from DB on mount
  useEffect(() => {
    if (!projectId) return;
    const fetchAssets = async () => {
      try {
        const { data } = await api.get(`/customization-assets/${projectId}`);
        const ci: CustomizedImage[] = [];
        const li: LifestyleImage[] = [];
        const drawings: Record<number, string> = {};
        const drawIds: Record<number, string> = {};
        let mb: string | null = null;
        let mbId: string | null = null;

        data.forEach((row: any) => {
          const meta = row.metadata || {};
          if (row.asset_type === "customized_image") {
            ci.push({ sourceLabel: meta.sourceLabel || "", url: row.url, colorHex: meta.colorHex || "", materialLabel: meta.materialLabel || "", dbId: row._id });
          } else if (row.asset_type === "lifestyle_image") {
            li.push({ sourceLabel: meta.sourceLabel || "", url: row.url, dbId: row._id });
          } else if (row.asset_type === "mood_board") {
            mb = row.url;
            mbId = row._id;
          } else if (row.asset_type === "customized_drawing") {
            const idx = meta.imageIndex ?? Object.keys(drawings).length;
            drawings[idx] = row.url;
            drawIds[idx] = row._id;
          }
        });

        setCustomizedImages(ci);
        setLifestyleImages(li);
        setMoodBoardUrl(mb);
        setMoodBoardDbId(mbId);
        setCustomizedDrawings(drawings);
        setDrawingDbIds(drawIds);
      } catch (error) {
        console.error("Failed to fetch assets", error);
      }
    };
    fetchAssets();
  }, [projectId]);

  const persistAsset = async (assetType: string, url: string, metadata: Record<string, any> = {}) => {
    try {
      const { data } = await api.post("/customization-assets", {
        projectId,
        asset_type: assetType,
        url,
        metadata,
      });
      return data._id || null;
    } catch (error) {
      console.error("Failed to persist asset:", error);
      return null;
    }
  };

  const deleteAssetReq = async (dbId: string) => {
    try {
      await api.delete(`/customization-assets/item/${dbId}`);
    } catch (error) {
      console.error("Failed to delete asset:", error);
    }
  };

  const addCustomizedImage = async (img: CustomizedImage) => {
    const dbId = await persistAsset("customized_image", img.url, { sourceLabel: img.sourceLabel, colorHex: img.colorHex, materialLabel: img.materialLabel });
    setCustomizedImages((prev) => [...prev, { ...img, dbId: dbId || undefined }]);
  };

  const removeCustomizedImage = (idx: number) => {
    setCustomizedImages((prev) => {
      const removed = prev[idx];
      if (removed?.dbId) deleteAssetReq(removed.dbId);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const clearCustomizedImages = () => {
    customizedImages.forEach(img => { if (img.dbId) deleteAssetReq(img.dbId); });
    setCustomizedImages([]);
  };

  const addLifestyleImage = async (img: LifestyleImage) => {
    const dbId = await persistAsset("lifestyle_image", img.url, { sourceLabel: img.sourceLabel });
    setLifestyleImages((prev) => [...prev, { ...img, dbId: dbId || undefined }]);
  };

  const removeLifestyleImage = (idx: number) => {
    setLifestyleImages((prev) => {
      const removed = prev[idx];
      if (removed?.dbId) deleteAssetReq(removed.dbId);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const addGradedSize = (size: GradedSize) => {
    setGradedSizes((prev) => {
      if (prev.some((s) => s.sizeNum === size.sizeNum)) return prev;
      return [...prev, size].sort((a, b) => a.sizeNum - b.sizeNum);
    });
  };

  const saveMoodBoard = async (url: string) => {
    if (moodBoardDbId) await deleteAssetReq(moodBoardDbId);
    const dbId = await persistAsset("mood_board", url);
    setMoodBoardUrl(url);
    setMoodBoardDbId(dbId);
  };

  const removeMoodBoard = () => {
    if (moodBoardDbId) deleteAssetReq(moodBoardDbId);
    setMoodBoardUrl(null);
    setMoodBoardDbId(null);
  };

  const saveCustomizedDrawing = async (idx: number, url: string) => {
    if (drawingDbIds[idx]) {
      try {
        await api.put(`/customization-assets/item/${drawingDbIds[idx]}`, { url });
        setCustomizedDrawings(prev => ({ ...prev, [idx]: url }));
      } catch (error) {
        console.error("Failed to update customized drawing:", error);
      }
      return;
    }

    const dbId = await persistAsset("customized_drawing", url, { imageIndex: idx });
    setCustomizedDrawings(prev => ({ ...prev, [idx]: url }));
    if (dbId) setDrawingDbIds(prev => ({ ...prev, [idx]: dbId }));
  };

  const removeCustomizedDrawing = (idx: number) => {
    if (drawingDbIds[idx]) deleteAssetReq(drawingDbIds[idx]);
    setCustomizedDrawings(prev => { const n = { ...prev }; delete n[idx]; return n; });
    setDrawingDbIds(prev => { const n = { ...prev }; delete n[idx]; return n; });
  };

  return (
    <CustomizationContext.Provider
      value={{
        customizedImages, addCustomizedImage, removeCustomizedImage, clearCustomizedImages,
        lifestyleImages, addLifestyleImage, removeLifestyleImage,
        gradedSizes, setGradedSizes, addGradedSize,
        moodBoardUrl, setMoodBoardUrl, saveMoodBoard, removeMoodBoard,
        customizedDrawings, setCustomizedDrawings, saveCustomizedDrawing, removeCustomizedDrawing,
      }}
    >
      {children}
    </CustomizationContext.Provider>
  );
};
