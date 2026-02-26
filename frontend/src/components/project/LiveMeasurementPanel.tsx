import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScanLine, X, Loader2, CheckCircle2, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { generateQRCodeDataURL } from "@/lib/qrcode";
import { toast } from "sonner";
import { getBaseSizeNum, getCategoryConfig, getSizeLabel, type CategoryKey } from "@/config/categoryConfig";

interface LiveMeasurementPanelProps {
  projectId: string;
  category: CategoryKey;
  baseSize: string;
  sizeSystem: string;
}

interface MeasurementSession {
  _id: string;
  status: string;
  measurements: Record<string, number>;
}

// ... (Recommendation engine stays the same as it's pure logic)
interface RecommendationRule {
  sourceKey: string;
  targetKey: string;
  transform: (value: number) => number;
  weight: number;
  preferNotSmaller?: boolean;
}

interface SizeRecommendationDetail {
  label: string;
  fit: "tight" | "balanced" | "roomy";
  delta: number;
  unit: string;
}

interface SizeRecommendation {
  sizeNum: number;
  sizeLabel: string;
  confidence: "High" | "Medium" | "Low";
  details: SizeRecommendationDetail[];
}

const BODY_TO_GARMENT_RULES: Record<CategoryKey, RecommendationRule[]> = {
  footwear: [
    { sourceKey: "foot_length", targetKey: "outsoleLength", transform: (value) => value * 10 + 10, weight: 2.0, preferNotSmaller: true },
    { sourceKey: "foot_width", targetKey: "outsoleWidthForefoot", transform: (value) => value * 10 * 0.88, weight: 0.5, preferNotSmaller: true },
  ],
  jacket: [
    { sourceKey: "chest_circumference", targetKey: "chestWidth", transform: (value) => value / 2 + 3, weight: 1.6, preferNotSmaller: true },
    { sourceKey: "waist_circumference", targetKey: "hemWidth", transform: (value) => value / 2 + 2.5, weight: 1.1, preferNotSmaller: true },
  ],
  dress: [
    { sourceKey: "bust_circumference", targetKey: "bustWidth", transform: (value) => value / 2 + 2, weight: 1.5, preferNotSmaller: true },
    { sourceKey: "waist_circumference", targetKey: "waistWidth", transform: (value) => value / 2 + 2, weight: 1.3, preferNotSmaller: true },
  ],
  tshirt: [
    { sourceKey: "chest_circumference", targetKey: "chestWidth", transform: (value) => value / 2 + 2, weight: 1.5, preferNotSmaller: true },
  ],
};

const fitFromDelta = (delta: number, step: number): "tight" | "balanced" | "roomy" => {
  if (delta < -step * 0.35) return "tight";
  if (delta > step * 0.35) return "roomy";
  return "balanced";
};

const confidenceFromScore = (score: number): "High" | "Medium" | "Low" => {
  if (score <= 1.1) return "High";
  if (score <= 2) return "Medium";
  return "Low";
};

const recommendSize = (category: CategoryKey, baseSize: string, sizeSystem: string, measurements: Record<string, number>): SizeRecommendation | null => {
  const catConfig = getCategoryConfig(category);
  const baseSizeNum = getBaseSizeNum(category, baseSize);
  const rules = BODY_TO_GARMENT_RULES[category] || [];
  if (!rules.length) return null;

  const gradingMap: Record<string, number> = {};
  catConfig.gradingIncrements.forEach((increment) => { gradingMap[increment.key] = increment.increment; });

  const measurementMeta = Object.fromEntries(catConfig.measurements.map((m) => [m.key, m]));
  const candidateSizes = Array.from({ length: catConfig.sizeRange.max - catConfig.sizeRange.min + 1 }, (_, index) => catConfig.sizeRange.min + index);

  let best: { sizeNum: number; score: number; details: SizeRecommendationDetail[] } | null = null;

  for (const sizeNum of candidateSizes) {
    const sizeDiff = sizeNum - baseSizeNum;
    const gradedMeasurements: Record<string, number> = {};
    for (const [key, baseValue] of Object.entries(catConfig.defaultBaseMeasurements)) {
      const increment = gradingMap[key] || 0;
      gradedMeasurements[key] = Math.round((baseValue + increment * sizeDiff) * 10) / 10;
    }

    let weightedScore = 0;
    let weightTotal = 0;
    const details: SizeRecommendationDetail[] = [];
    for (const rule of rules) {
      const bodyValue = measurements[rule.sourceKey];
      const garmentValue = gradedMeasurements[rule.targetKey];
      if (typeof bodyValue !== "number" || typeof garmentValue !== "number") continue;
      const targetValue = rule.transform(bodyValue);
      const delta = Math.round((garmentValue - targetValue) * 10) / 10;
      const step = Math.max(Math.abs(gradingMap[rule.targetKey] || 1), 0.5);
      let normalizedScore = Math.abs(delta) / step;
      if (rule.preferNotSmaller && delta < 0) normalizedScore *= 1.6;
      weightedScore += normalizedScore * rule.weight;
      weightTotal += rule.weight;
      details.push({ label: measurementMeta[rule.targetKey]?.label || rule.targetKey, fit: fitFromDelta(delta, step), delta, unit: measurementMeta[rule.targetKey]?.unit || "cm" });
    }
    if (weightTotal === 0) continue;
    const score = weightedScore / weightTotal;
    if (!best || score < best.score) best = { sizeNum, score, details };
  }
  if (!best) return null;
  return { sizeNum: best.sizeNum, sizeLabel: getSizeLabel(category, best.sizeNum, sizeSystem), confidence: confidenceFromScore(best.score), details: best.details.sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta)).slice(0, 3) };
};

const LiveMeasurementPanel = ({ projectId, category, baseSize, sizeSystem }: LiveMeasurementPanelProps) => {
  const { user } = useAuth();
  const [session, setSession] = useState<MeasurementSession | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  const createSession = useCallback(async () => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }
    setIsCreating(true);
    try {
      const { data } = await api.post("/measurements", {
        projectId,
        category,
        status: "pending",
      });
      setSession(data);
      const measureUrl = `${window.location.origin}/measure/${data._id}?projectId=${projectId}&category=${category}`;
      const dataUrl = await generateQRCodeDataURL(measureUrl);
      setQrDataUrl(dataUrl);
      setShowPanel(true);
    } catch (err: any) {
      toast.error("Failed to create session");
    } finally {
      setIsCreating(false);
    }
  }, [user, projectId, category]);

  // Polling for updates
  useEffect(() => {
    if (!session || session.status === "completed" || session.status === "failed") return;

    const interval = setInterval(async () => {
      try {
        const { data } = await api.get(`/measurements/${projectId}`);
        if (data && data.length > 0) {
          const latest = data[0];
          if (latest.status === "completed") {
            setSession(latest);
            toast.success("Measurements captured!");
            clearInterval(interval);
          } else if (latest.status === "failed") {
            setSession(latest);
            toast.error("Measurement failed");
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.error("Polling error", error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [session, projectId]);

  const recommendation = useMemo(() => {
    if (session?.status !== "completed" || !session.measurements) return null;
    return recommendSize(category, baseSize, sizeSystem, session.measurements);
  }, [session?.status, session?.measurements, category, baseSize, sizeSystem]);

  if (!showPanel) {
    return (
      <Button variant="outline" size="sm" onClick={createSession} disabled={isCreating} className="gap-2">
        {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
        Live Measurement
      </Button>
    );
  }

  const isCompleted = session?.status === "completed";
  const isProcessing = session?.status === "processing";
  const isFailed = session?.status === "failed";

  return (
    <div className="glass rounded-lg p-5 space-y-4 bg-white shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScanLine className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold">Live Body Measurement</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowPanel(false)}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {!isCompleted && (
        <div className="flex flex-col sm:flex-row gap-6 items-center">
          <div className="bg-white p-3 rounded-lg shadow-sm border">
            {qrDataUrl && <img src={qrDataUrl} alt="QR Code" className="w-[180px] h-[180px]" />}
          </div>
          <div className="text-center sm:text-left space-y-2 flex-1">
            <p className="text-sm text-muted-foreground">Scan QR to open mobile camera.</p>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              {isProcessing ? (
                <Badge variant="secondary" className="gap-1"><Loader2 className="w-3 h-3 animate-spin" />Processing</Badge>
              ) : isFailed ? (
                <Badge variant="destructive">Failed</Badge>
              ) : (
                <Badge variant="secondary"><span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse mr-1.5" />Waiting for scan</Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {isCompleted && session.measurements && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
            <CheckCircle2 className="w-4 h-4" /> Received
          </div>
          {recommendation && (
            <div className="rounded-md border bg-primary/5 p-3 space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">Recommended Size</p>
                <Badge variant="secondary">{recommendation.confidence}</Badge>
              </div>
              <p className="text-lg font-bold">{recommendation.sizeLabel}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(session.measurements).map(([k, v]) => (
              <div key={k} className="bg-secondary/20 p-2 rounded">
                <p className="text-[10px] uppercase text-muted-foreground">{k.replace(/_/g, ' ')}</p>
                <p className="text-sm font-semibold">{v} cm</p>
              </div>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={createSession} className="w-full">
            <RefreshCw className="w-3 h-3 mr-2" /> New Scan
          </Button>
        </div>
      )}
    </div>
  );
};

export default LiveMeasurementPanel;
