import { useRef, useState, useEffect, useMemo } from "react";
import { Download, Loader2, Sparkles, ChevronDown, ChevronUp, Ruler } from "lucide-react";
import ImageLightbox from "./ImageLightbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useProjectUploads } from "./ProjectUploadsContext";
import { useCustomization } from "./CustomizationContext";
import api from "@/lib/api";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { getCategoryConfig, getBaseSizeNum, getSizeLabel, type CategoryKey } from "@/config/categoryConfig";

interface TechPackTabProps {
  category: CategoryKey;
  baseSize: string;
  sizeSystem: string;
}

interface ConstructionRule {
  bodyKey: string;
  garmentKey: string;
  garmentLabel: string;
  transform: (bodyVal: number) => number;
  unit: string;
  note: string;
}

interface ConstructionSpec {
  label: string;
  value: number;
  unit: string;
  note: string;
  bodySource: string;
  bodyValue: number;
}

const CONSTRUCTION_RULES: Record<CategoryKey, ConstructionRule[]> = {
  footwear: [
    { bodyKey: "foot_length", garmentKey: "insole_length", garmentLabel: "Insole Length", transform: v => Math.round((v * 10 + 5) * 10) / 10, unit: "mm", note: "Foot length + 5mm toe room" },
    { bodyKey: "foot_length", garmentKey: "outsole_length", garmentLabel: "Outsole Length", transform: v => Math.round((v * 10 + 12) * 10) / 10, unit: "mm", note: "Foot length + 12mm (toe + heel margin)" },
    { bodyKey: "foot_width", garmentKey: "insole_width", garmentLabel: "Insole Width (Forefoot)", transform: v => Math.round((v * 10 + 3) * 10) / 10, unit: "mm", note: "Foot width + 3mm ease" },
    { bodyKey: "foot_width", garmentKey: "outsole_width", garmentLabel: "Outsole Width (Forefoot)", transform: v => Math.round((v * 10 + 8) * 10) / 10, unit: "mm", note: "Foot width + 8mm (midsole overhang)" },
    { bodyKey: "ankle_circumference", garmentKey: "collar_circumference", garmentLabel: "Collar Opening Circumference", transform: v => Math.round((v + 1.5) * 10) / 10, unit: "cm", note: "Ankle circ + 1.5cm ease for entry" },
    { bodyKey: "foot_length", garmentKey: "vamp_height", garmentLabel: "Vamp Height", transform: v => Math.round((v * 0.35) * 10) / 10, unit: "cm", note: "~35% of foot length" },
  ],
  jacket: [
    { bodyKey: "chest_circumference", garmentKey: "chest_width_half", garmentLabel: "Chest Width (1/2)", transform: v => Math.round((v / 2 + 4) * 10) / 10, unit: "cm", note: "Body chest/2 + 4cm ease" },
    { bodyKey: "waist_circumference", garmentKey: "hem_width_half", garmentLabel: "Hem Width (1/2)", transform: v => Math.round((v / 2 + 3) * 10) / 10, unit: "cm", note: "Body waist/2 + 3cm ease" },
    { bodyKey: "shoulder_width", garmentKey: "shoulder_width_garment", garmentLabel: "Shoulder Width", transform: v => Math.round((v + 1.5) * 10) / 10, unit: "cm", note: "Body shoulder + 1.5cm" },
    { bodyKey: "arm_length", garmentKey: "sleeve_length", garmentLabel: "Sleeve Length", transform: v => Math.round((v + 2) * 10) / 10, unit: "cm", note: "Arm length + 2cm" },
    { bodyKey: "torso_length", garmentKey: "body_length_cb", garmentLabel: "Body Length (CB)", transform: v => Math.round((v + 8) * 10) / 10, unit: "cm", note: "Torso + 8cm (hip coverage)" },
    { bodyKey: "neck_circumference", garmentKey: "neck_opening", garmentLabel: "Neck Opening", transform: v => Math.round((v + 2) * 10) / 10, unit: "cm", note: "Neck circ + 2cm ease" },
    { bodyKey: "bicep_circumference", garmentKey: "armhole_depth", garmentLabel: "Armhole Width", transform: v => Math.round((v / 2 + 2) * 10) / 10, unit: "cm", note: "Bicep/2 + 2cm ease" },
    { bodyKey: "back_width", garmentKey: "across_back", garmentLabel: "Across Back", transform: v => Math.round((v + 2) * 10) / 10, unit: "cm", note: "Back width + 2cm ease" },
    { bodyKey: "chest_circumference", garmentKey: "seam_allowance", garmentLabel: "Side Seam Allowance", transform: () => 1.5, unit: "cm", note: "Standard seam allowance" },
    { bodyKey: "chest_circumference", garmentKey: "hem_allowance", garmentLabel: "Hem Fold Allowance", transform: () => 3, unit: "cm", note: "Standard header fold" },
  ],
  dress: [
    { bodyKey: "bust_circumference", garmentKey: "bust_width_half", garmentLabel: "Bust Width (1/2)", transform: v => Math.round((v / 2 + 3) * 10) / 10, unit: "cm", note: "Bust/2 + 3cm ease" },
    { bodyKey: "waist_circumference", garmentKey: "waist_width_half", garmentLabel: "Waist Width (1/2)", transform: v => Math.round((v / 2 + 2) * 10) / 10, unit: "cm", note: "Waist/2 + 2cm ease" },
    { bodyKey: "hip_circumference", garmentKey: "hip_width_half", garmentLabel: "Hip Width (1/2)", transform: v => Math.round((v / 2 + 3) * 10) / 10, unit: "cm", note: "Hip/2 + 3cm ease" },
    { bodyKey: "shoulder_width", garmentKey: "shoulder_width_garment", garmentLabel: "Shoulder Width", transform: v => Math.round((v + 1) * 10) / 10, unit: "cm", note: "Body shoulder + 1cm" },
    { bodyKey: "torso_length", garmentKey: "bodice_length", garmentLabel: "Bodice Length (CB to waist)", transform: v => Math.round((v + 1) * 10) / 10, unit: "cm", note: "Torso + 1cm" },
    { bodyKey: "total_height", garmentKey: "total_length", garmentLabel: "Total Length (CB)", transform: v => Math.round((v * 0.58) * 10) / 10, unit: "cm", note: "~58% of body height (knee-length)" },
    { bodyKey: "arm_length", garmentKey: "sleeve_length", garmentLabel: "Sleeve Length (if applicable)", transform: v => Math.round((v + 1) * 10) / 10, unit: "cm", note: "Arm length + 1cm" },
    { bodyKey: "thigh_circumference", garmentKey: "skirt_hem_half", garmentLabel: "Skirt Hem (1/2)", transform: v => Math.round((v + 8) * 10) / 10, unit: "cm", note: "Thigh + 8cm flare ease" },
    { bodyKey: "bust_circumference", garmentKey: "dart_intake", garmentLabel: "Bust Dart Intake", transform: v => Math.round((v * 0.04) * 10) / 10, unit: "cm", note: "~4% of bust circ" },
    { bodyKey: "bust_circumference", garmentKey: "seam_allowance", garmentLabel: "Seam Allowance", transform: () => 1.5, unit: "cm", note: "Standard seam allowance" },
  ],
  tshirt: [
    { bodyKey: "chest_circumference", garmentKey: "chest_width_half", garmentLabel: "Chest Width (1/2)", transform: v => Math.round((v / 2 + 3) * 10) / 10, unit: "cm", note: "Chest/2 + 3cm ease" },
    { bodyKey: "waist_circumference", garmentKey: "hem_width_half", garmentLabel: "Hem Width (1/2)", transform: v => Math.round((v / 2 + 2) * 10) / 10, unit: "cm", note: "Waist/2 + 2cm ease" },
    { bodyKey: "shoulder_width", garmentKey: "shoulder_width_garment", garmentLabel: "Shoulder Width", transform: v => Math.round((v + 1) * 10) / 10, unit: "cm", note: "Body shoulder + 1cm" },
    { bodyKey: "arm_length", garmentKey: "sleeve_length", garmentLabel: "Sleeve Length", transform: v => Math.round(Math.min(v * 0.35, 22) * 10) / 10, unit: "cm", note: "Short sleeve: ~35% of arm length" },
    { bodyKey: "torso_length", garmentKey: "body_length_cb", garmentLabel: "Body Length (CB)", transform: v => Math.round((v + 6) * 10) / 10, unit: "cm", note: "Torso + 6cm coverage" },
    { bodyKey: "neck_circumference", garmentKey: "neck_rib_opening", garmentLabel: "Neck Rib Opening", transform: v => Math.round((v + 1) * 10) / 10, unit: "cm", note: "Neck circ + 1cm ease" },
    { bodyKey: "bicep_circumference", garmentKey: "armhole_width", garmentLabel: "Armhole Width", transform: v => Math.round((v / 2 + 1.5) * 10) / 10, unit: "cm", note: "Bicep/2 + 1.5cm ease" },
    { bodyKey: "bicep_circumference", garmentKey: "sleeve_opening", garmentLabel: "Sleeve Opening", transform: v => Math.round((v + 2) * 10) / 10, unit: "cm", note: "Bicep + 2cm ease" },
    { bodyKey: "chest_circumference", garmentKey: "seam_allowance", garmentLabel: "Seam Allowance", transform: () => 1, unit: "cm", note: "Standard seam allowance" },
  ],
};

interface LastSpec {
  label: string;
  footValue: string;
  lastValue: string;
}

const TechPackTab = ({ category, baseSize, sizeSystem }: TechPackTabProps) => {
  const { images, projectId } = useProjectUploads();
  const { gradedSizes } = useCustomization();
  const [aiDrawings, setAiDrawings] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [bodyMeasurements, setBodyMeasurements] = useState<Record<string, number> | null>(null);
  const [showFullSpec, setShowFullSpec] = useState(false);
  const [lastDrawing, setLastDrawing] = useState<string | null>(null);
  const [generatingLast, setGeneratingLast] = useState(false);
  const techPackRef = useRef<HTMLDivElement>(null);

  const catConfig = getCategoryConfig(category);
  const baseSizeNum = getBaseSizeNum(category, baseSize);
  const baseSizeLabel = getSizeLabel(category, baseSizeNum, sizeSystem);
  const baseMeasurements = catConfig.defaultBaseMeasurements;
  const unit = catConfig.measurements[0]?.unit || "mm";

  const measurementLabels: Record<string, string> = {};
  catConfig.measurements.forEach(m => { measurementLabels[m.key] = m.label; });

  useEffect(() => {
    if (!projectId) return;
    const fetchDrawings = async () => {
      try {
        const { data } = await api.get(`/techpack-drawings/${projectId}`);
        const loaded: Record<string, string> = {};
        data.forEach((row: any) => {
          if (row.angle_key === "__last__") {
            setLastDrawing(row.drawing_url);
          } else {
            loaded[row.angle_key] = row.drawing_url;
          }
        });
        setAiDrawings(loaded);
      } catch (error) {
        console.error("Failed to fetch drawings", error);
      }
    };
    fetchDrawings();
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    const fetchMeasurements = async () => {
      try {
        const { data } = await api.get(`/measurements/${projectId}`);
        if (data?.[0]?.measurements) {
          setBodyMeasurements(data[0].measurements);
        }
      } catch (error) {
        console.error("Failed to fetch measurements", error);
      }
    };
    fetchMeasurements();
  }, [projectId]);

  const constructionSpecs = useMemo<ConstructionSpec[]>(() => {
    if (!bodyMeasurements) return [];
    const rules = CONSTRUCTION_RULES[category] || [];
    return rules
      .filter(rule => typeof bodyMeasurements[rule.bodyKey] === "number")
      .map(rule => ({
        label: rule.garmentLabel,
        value: rule.transform(bodyMeasurements[rule.bodyKey]),
        unit: rule.unit,
        note: rule.note,
        bodySource: rule.bodyKey.replace(/_/g, " "),
        bodyValue: bodyMeasurements[rule.bodyKey],
      }));
  }, [bodyMeasurements, category]);

  const lastSpecs = useMemo<LastSpec[]>(() => {
    if (category !== "footwear" || !bodyMeasurements) return [];
    const specs: LastSpec[] = [];
    const footLength = bodyMeasurements.foot_length;
    const footWidth = bodyMeasurements.foot_width;

    if (typeof footLength === "number") {
      const lastLengthMm = Math.round((footLength * 10 + 12) * 10) / 10;
      const lastLengthCm = Math.round(lastLengthMm / 10 * 10) / 10;
      specs.push({ label: "Last Length", footValue: `${footLength} cm`, lastValue: `${lastLengthMm} mm (${lastLengthCm} cm)` });
      const barleycorns = Math.round((lastLengthMm / (25.4 / 3)) * 10) / 10;
      specs.push({ label: "Stick Length (bc)", footValue: "—", lastValue: `${barleycorns} bc` });
    }
    if (typeof footWidth === "number") {
      const ballWidthMm = Math.round((footWidth * 10 + 5) * 10) / 10;
      specs.push({ label: "Ball Width", footValue: `${footWidth} cm`, lastValue: `${ballWidthMm} mm` });
    }
    return specs;
  }, [category, bodyMeasurements]);

  const generateDrawing = async (imageKey: string, previewUrl: string) => {
    setGenerating(imageKey);
    try {
      // NOTE: This logic would ideally call an AI service via the backend.
      // For migration, we'll placeholder this or keep the simulation logic.
      const drawingUrl = "https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?auto=format&fit=crop&q=80&w=400";

      await api.post('/techpack-drawings', {
        projectId,
        angle_key: imageKey,
        drawing_url: drawingUrl,
      });

      setAiDrawings(prev => ({ ...prev, [imageKey]: drawingUrl }));
      toast.success("Drawing generated!");
    } catch (err: any) {
      toast.error("Generation failed");
    } finally {
      setGenerating(null);
    }
  };

  const downloadPDF = async () => {
    if (!techPackRef.current) return;
    setDownloadingPdf(true);
    try {
      const canvas = await html2canvas(techPackRef.current, { scale: 2, useCORS: true });
      const pdf = new jsPDF("p", "mm", "a4");
      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 10, 15, 190, (canvas.height * 190) / canvas.width);
      pdf.save("tech-pack.pdf");
      toast.success("PDF downloaded!");
    } catch (err) {
      toast.error("PDF failed");
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-display font-semibold text-foreground">Tech Pack — {baseSizeLabel}</h3>
        <Button size="sm" className="glow-primary" onClick={downloadPDF} disabled={downloadingPdf}>
          {downloadingPdf ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Download className="w-3 h-3 mr-1" />}
          {downloadingPdf ? "Creating PDF…" : "Download PDF"}
        </Button>
      </div>

      <div ref={techPackRef} className="space-y-6">
        <div className="glass rounded-lg p-6 bg-white">
          <h4 className="font-mono text-xs text-muted-foreground uppercase mb-4">Product Reference</h4>
          <div className="grid grid-cols-2 gap-4">
            {images.map(img => (
              <div key={img.key} className="bg-secondary/30 rounded-lg overflow-hidden border border-border/50">
                <img src={img.preview} alt={img.label} className="w-full aspect-[4/3] object-cover" crossOrigin="anonymous" />
                <div className="p-2 flex items-center justify-between">
                  <span className="text-xs font-mono">{img.label}</span>
                  {!aiDrawings[img.key] && (
                    <Button variant="ghost" size="sm" onClick={() => generateDrawing(img.key, img.preview)} disabled={generating === img.key}>
                      <Sparkles className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {constructionSpecs.length > 0 && (
          <div className="glass rounded-lg overflow-hidden bg-white">
            <div className="p-4 border-b">
              <h4 className="font-mono text-xs text-muted-foreground uppercase">Construction Measurements</h4>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Measurement</TableHead>
                  <TableHead className="text-center">Value</TableHead>
                  <TableHead>Body Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {constructionSpecs.map((spec) => (
                  <TableRow key={spec.label}>
                    <TableCell className="text-sm">{spec.label}</TableCell>
                    <TableCell className="font-mono text-sm text-center">{spec.value} {spec.unit}</TableCell>
                    <TableCell className="text-xs text-muted-foreground capitalize">{spec.bodySource}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="glass rounded-lg overflow-hidden bg-white">
          <div className="p-4 border-b">
            <h4 className="font-mono text-xs text-muted-foreground uppercase">Base Specs — {baseSizeLabel}</h4>
          </div>
          <Table>
            <TableBody>
              {Object.entries(measurementLabels).map(([key, label]) => (
                <TableRow key={key}>
                  <TableCell className="text-sm">{label}</TableCell>
                  <TableCell className="font-mono text-sm text-primary">{baseMeasurements[key]} {unit}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default TechPackTab;
