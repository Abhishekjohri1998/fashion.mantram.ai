// ─── Apparel Category Configuration ───
// Central config for measurements, angles, sizes, grading, and mood-board keywords per category.

export type CategoryKey = "footwear" | "jacket" | "dress" | "tshirt";

export interface MeasurementDef {
  key: string;
  label: string;
  unit: string;
}

export interface AngleDef {
  key: string;
  label: string;
}

export interface GradingIncrement {
  key: string;
  increment: number; // per size step
}

export interface CategoryConfig {
  key: CategoryKey;
  label: string;
  icon: string; // lucide icon name hint
  sizeRange: { min: number; max: number };
  defaultBaseSize: string;
  sizeSystems: string[];
  quickSizes: number[];
  measurements: MeasurementDef[];
  defaultBaseMeasurements: Record<string, number>;
  gradingIncrements: GradingIncrement[];
  tolerances: Record<string, string>;
  requiredAngles: AngleDef[];
  optionalAngles: AngleDef[];
  suggestedKeywords: string[];
}

// ─── Footwear ───
const footwear: CategoryConfig = {
  key: "footwear",
  label: "Footwear",
  icon: "Footprints",
  sizeRange: { min: 20, max: 50 },
  defaultBaseSize: "30",
  sizeSystems: ["EU", "US", "UK"],
  quickSizes: [36, 38, 40, 42, 44, 46],
  measurements: [
    { key: "outsoleLength", label: "Outsole Length", unit: "mm" },
    { key: "outsoleWidthForefoot", label: "Outsole Width (Forefoot)", unit: "mm" },
    { key: "outsoleWidthHeel", label: "Outsole Width (Heel)", unit: "mm" },
    { key: "heelHeight", label: "Heel Height", unit: "mm" },
    { key: "soleThicknessForefoot", label: "Sole Thickness (Forefoot)", unit: "mm" },
    { key: "soleThicknessHeel", label: "Sole Thickness (Heel)", unit: "mm" },
    { key: "upperVampHeight", label: "Upper Vamp Height", unit: "mm" },
    { key: "laceSpacing", label: "Lace Spacing", unit: "mm" },
  ],
  defaultBaseMeasurements: {
    outsoleLength: 195, outsoleWidthForefoot: 78, outsoleWidthHeel: 62,
    heelHeight: 28, soleThicknessForefoot: 12, soleThicknessHeel: 22,
    upperVampHeight: 55, laceSpacing: 18,
  },
  gradingIncrements: [
    { key: "outsoleLength", increment: 6.67 },
    { key: "outsoleWidthForefoot", increment: 2.0 },
    { key: "outsoleWidthHeel", increment: 1.5 },
    { key: "heelHeight", increment: 0.33 },
    { key: "soleThicknessForefoot", increment: 0.2 },
    { key: "soleThicknessHeel", increment: 0.3 },
    { key: "upperVampHeight", increment: 1.5 },
    { key: "laceSpacing", increment: 0.4 },
  ],
  tolerances: {
    outsoleLength: "±1.5 mm", outsoleWidthForefoot: "±1.0 mm", outsoleWidthHeel: "±1.0 mm",
    heelHeight: "±0.5 mm", soleThicknessForefoot: "±0.5 mm", soleThicknessHeel: "±0.5 mm",
    upperVampHeight: "±1.0 mm", laceSpacing: "±0.5 mm",
  },
  requiredAngles: [
    { key: "lateral", label: "Lateral Side" },
    { key: "medial", label: "Medial Side" },
    { key: "top", label: "Top View" },
    { key: "bottom", label: "Bottom / Sole" },
    { key: "heel", label: "Heel Back" },
    { key: "front", label: "Front Toe" },
  ],
  optionalAngles: [
    { key: "closeup_stitch", label: "Stitching Closeup" },
    { key: "closeup_logo", label: "Logo Detail" },
    { key: "closeup_outsole", label: "Outsole Pattern" },
  ],
  suggestedKeywords: [
    "Streetwear", "Athletic", "Minimalist", "Retro", "Luxury", "Sustainable",
    "Urban", "Trail", "Casual", "Formal", "Sporty", "Vintage",
  ],
};

// ─── Jacket / Outerwear ───
const jacket: CategoryConfig = {
  key: "jacket",
  label: "Jacket & Outerwear",
  icon: "Shirt",
  sizeRange: { min: 0, max: 10 }, // XS=0, S=1, M=2, L=3, XL=4 mapped
  defaultBaseSize: "M",
  sizeSystems: ["US", "EU", "UK"],
  quickSizes: [0, 1, 2, 3, 4, 5], // XS-XXL
  measurements: [
    { key: "chestWidth", label: "Chest Width (1/2)", unit: "cm" },
    { key: "shoulderWidth", label: "Shoulder Width", unit: "cm" },
    { key: "sleeveLength", label: "Sleeve Length", unit: "cm" },
    { key: "bodyLength", label: "Body Length (CB)", unit: "cm" },
    { key: "hemWidth", label: "Hem Width (1/2)", unit: "cm" },
    { key: "neckOpening", label: "Neck Opening", unit: "cm" },
    { key: "armholeDepth", label: "Armhole Depth", unit: "cm" },
    { key: "cuffWidth", label: "Cuff Width", unit: "cm" },
  ],
  defaultBaseMeasurements: {
    chestWidth: 54, shoulderWidth: 46, sleeveLength: 64,
    bodyLength: 70, hemWidth: 52, neckOpening: 42,
    armholeDepth: 24, cuffWidth: 12,
  },
  gradingIncrements: [
    { key: "chestWidth", increment: 2.0 },
    { key: "shoulderWidth", increment: 1.5 },
    { key: "sleeveLength", increment: 1.0 },
    { key: "bodyLength", increment: 1.5 },
    { key: "hemWidth", increment: 2.0 },
    { key: "neckOpening", increment: 0.5 },
    { key: "armholeDepth", increment: 0.5 },
    { key: "cuffWidth", increment: 0.3 },
  ],
  tolerances: {
    chestWidth: "±1.0 cm", shoulderWidth: "±0.5 cm", sleeveLength: "±1.0 cm",
    bodyLength: "±1.0 cm", hemWidth: "±1.0 cm", neckOpening: "±0.5 cm",
    armholeDepth: "±0.5 cm", cuffWidth: "±0.5 cm",
  },
  requiredAngles: [
    { key: "front", label: "Front View" },
    { key: "back", label: "Back View" },
    { key: "side", label: "Side View" },
    { key: "collar", label: "Collar Detail" },
    { key: "sleeve", label: "Sleeve Detail" },
    { key: "inside", label: "Inside / Lining" },
  ],
  optionalAngles: [
    { key: "closeup_zipper", label: "Zipper / Closure Detail" },
    { key: "closeup_pocket", label: "Pocket Detail" },
    { key: "closeup_label", label: "Brand Label" },
  ],
  suggestedKeywords: [
    "Streetwear", "Military", "Workwear", "Athleisure", "Puffer", "Bomber",
    "Minimalist", "Techwear", "Vintage", "Luxury", "Sustainable", "Oversized",
  ],
};

// ─── Dress ───
const dress: CategoryConfig = {
  key: "dress",
  label: "Dress",
  icon: "Shirt",
  sizeRange: { min: 0, max: 10 },
  defaultBaseSize: "M",
  sizeSystems: ["US", "EU", "UK"],
  quickSizes: [0, 1, 2, 3, 4, 5],
  measurements: [
    { key: "bustWidth", label: "Bust Width (1/2)", unit: "cm" },
    { key: "waistWidth", label: "Waist Width (1/2)", unit: "cm" },
    { key: "hipWidth", label: "Hip Width (1/2)", unit: "cm" },
    { key: "totalLength", label: "Total Length (CB)", unit: "cm" },
    { key: "shoulderWidth", label: "Shoulder Width", unit: "cm" },
    { key: "skirtLength", label: "Skirt Length", unit: "cm" },
    { key: "neckDrop", label: "Neck Drop (Front)", unit: "cm" },
    { key: "hemCircumference", label: "Hem Circumference (1/2)", unit: "cm" },
  ],
  defaultBaseMeasurements: {
    bustWidth: 46, waistWidth: 38, hipWidth: 50,
    totalLength: 100, shoulderWidth: 38, skirtLength: 60,
    neckDrop: 12, hemCircumference: 56,
  },
  gradingIncrements: [
    { key: "bustWidth", increment: 2.0 },
    { key: "waistWidth", increment: 2.0 },
    { key: "hipWidth", increment: 2.0 },
    { key: "totalLength", increment: 1.0 },
    { key: "shoulderWidth", increment: 1.0 },
    { key: "skirtLength", increment: 0.5 },
    { key: "neckDrop", increment: 0.3 },
    { key: "hemCircumference", increment: 2.0 },
  ],
  tolerances: {
    bustWidth: "±1.0 cm", waistWidth: "±1.0 cm", hipWidth: "±1.0 cm",
    totalLength: "±1.5 cm", shoulderWidth: "±0.5 cm", skirtLength: "±1.0 cm",
    neckDrop: "±0.5 cm", hemCircumference: "±1.0 cm",
  },
  requiredAngles: [
    { key: "front", label: "Front View" },
    { key: "back", label: "Back View" },
    { key: "side", label: "Side View" },
    { key: "neckline", label: "Neckline Detail" },
    { key: "hemline", label: "Hemline Detail" },
    { key: "closure", label: "Closure / Zipper" },
  ],
  optionalAngles: [
    { key: "closeup_fabric", label: "Fabric Closeup" },
    { key: "closeup_embellishment", label: "Embellishment Detail" },
    { key: "closeup_label", label: "Brand Label" },
  ],
  suggestedKeywords: [
    "Evening", "Casual", "Cocktail", "Boho", "Minimalist", "A-Line",
    "Wrap", "Maxi", "Midi", "Bridal", "Sustainable", "Avant-Garde",
  ],
};

// ─── T-Shirt / Top ───
const tshirt: CategoryConfig = {
  key: "tshirt",
  label: "T-Shirt & Top",
  icon: "Shirt",
  sizeRange: { min: 0, max: 10 },
  defaultBaseSize: "M",
  sizeSystems: ["US", "EU", "UK"],
  quickSizes: [0, 1, 2, 3, 4, 5],
  measurements: [
    { key: "chestWidth", label: "Chest Width (1/2)", unit: "cm" },
    { key: "bodyLength", label: "Body Length (CB)", unit: "cm" },
    { key: "shoulderWidth", label: "Shoulder Width", unit: "cm" },
    { key: "sleeveLength", label: "Sleeve Length", unit: "cm" },
    { key: "hemWidth", label: "Hem Width (1/2)", unit: "cm" },
    { key: "neckRibHeight", label: "Neck Rib Height", unit: "cm" },
    { key: "armholeWidth", label: "Armhole Width (Straight)", unit: "cm" },
    { key: "sleeveOpening", label: "Sleeve Opening", unit: "cm" },
  ],
  defaultBaseMeasurements: {
    chestWidth: 50, bodyLength: 72, shoulderWidth: 44,
    sleeveLength: 20, hemWidth: 50, neckRibHeight: 2,
    armholeWidth: 22, sleeveOpening: 18,
  },
  gradingIncrements: [
    { key: "chestWidth", increment: 2.0 },
    { key: "bodyLength", increment: 1.5 },
    { key: "shoulderWidth", increment: 1.0 },
    { key: "sleeveLength", increment: 0.5 },
    { key: "hemWidth", increment: 2.0 },
    { key: "neckRibHeight", increment: 0 },
    { key: "armholeWidth", increment: 0.5 },
    { key: "sleeveOpening", increment: 0.5 },
  ],
  tolerances: {
    chestWidth: "±1.0 cm", bodyLength: "±1.0 cm", shoulderWidth: "±0.5 cm",
    sleeveLength: "±0.5 cm", hemWidth: "±1.0 cm", neckRibHeight: "±0.2 cm",
    armholeWidth: "±0.5 cm", sleeveOpening: "±0.5 cm",
  },
  requiredAngles: [
    { key: "front", label: "Front View" },
    { key: "back", label: "Back View" },
    { key: "side", label: "Side View" },
    { key: "collar", label: "Collar / Neckline" },
    { key: "sleeve", label: "Sleeve Detail" },
    { key: "hem", label: "Hem Detail" },
  ],
  optionalAngles: [
    { key: "closeup_print", label: "Print / Graphic Detail" },
    { key: "closeup_label", label: "Brand Label" },
    { key: "closeup_stitch", label: "Stitching Detail" },
  ],
  suggestedKeywords: [
    "Streetwear", "Athletic", "Oversized", "Fitted", "Vintage", "Graphic",
    "Minimalist", "Basic", "Sustainable", "Luxury", "Casual", "Layering",
  ],
};

// ─── Registry ───
export const CATEGORIES: Record<CategoryKey, CategoryConfig> = {
  footwear,
  jacket,
  dress,
  tshirt,
};

export const CATEGORY_LIST: CategoryConfig[] = [footwear, jacket, dress, tshirt];

export const getCategoryConfig = (key: string): CategoryConfig => {
  return CATEGORIES[key as CategoryKey] || footwear;
};

// Size label helpers for apparel categories (XS, S, M, L, XL, XXL)
const apparelSizeLabels: Record<number, string> = {
  0: "XS", 1: "S", 2: "M", 3: "L", 4: "XL", 5: "XXL",
  6: "3XL", 7: "4XL", 8: "5XL", 9: "6XL", 10: "7XL",
};

export const getSizeLabel = (category: CategoryKey, sizeNum: number, sizeSystem: string): string => {
  if (category === "footwear") {
    return `${sizeSystem} ${sizeNum}`;
  }
  return apparelSizeLabels[sizeNum] || `Size ${sizeNum}`;
};

export const getBaseSizeNum = (category: CategoryKey, baseSize: string): number => {
  if (category === "footwear") return parseFloat(baseSize) || 30;
  // For apparel, map the letter to a number
  const idx = Object.entries(apparelSizeLabels).find(([, v]) => v === baseSize)?.[0];
  return idx !== undefined ? Number(idx) : 2; // default M
};
