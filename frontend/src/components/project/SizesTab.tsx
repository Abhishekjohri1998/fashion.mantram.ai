import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCustomization } from "./CustomizationContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Download, Ruler, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { getCategoryConfig, getBaseSizeNum, getSizeLabel, type CategoryKey } from "@/config/categoryConfig";
import LiveMeasurementPanel from "./LiveMeasurementPanel";

interface SizesTabProps {
  category: CategoryKey;
  baseSize: string;
  sizeSystem: string;
  projectId?: string;
}

interface GradedSize {
  size: string;
  sizeNum: number;
  measurements: Record<string, number>;
}

const SizesTab = ({ category, baseSize, sizeSystem, projectId }: SizesTabProps) => {
  const { addGradedSize } = useCustomization();
  const [targetSize, setTargetSize] = useState("");
  const [ruleset, setRuleset] = useState("default");
  const [gradedSizes, setGradedSizes] = useState<GradedSize[]>([]);
  const [generating, setGenerating] = useState(false);

  const catConfig = getCategoryConfig(category);
  const baseSizeNum = getBaseSizeNum(category, baseSize);
  const baseMeasurements = catConfig.defaultBaseMeasurements;
  const gradingMap: Record<string, number> = {};
  catConfig.gradingIncrements.forEach(g => { gradingMap[g.key] = g.increment; });

  const measurementLabels: Record<string, string> = {};
  catConfig.measurements.forEach(m => { measurementLabels[m.key] = m.label; });

  const gradeForSize = (sizeNum: number): Record<string, number> => {
    const sizeDiff = sizeNum - baseSizeNum;
    const result: Record<string, number> = {};
    for (const key of Object.keys(baseMeasurements)) {
      const increment = gradingMap[key] || 0;
      result[key] = Math.round((baseMeasurements[key] + increment * sizeDiff) * 10) / 10;
    }
    return result;
  };

  const handleGenerate = () => {
    const sizeNum = parseFloat(targetSize);
    if (isNaN(sizeNum) || sizeNum < catConfig.sizeRange.min || sizeNum > catConfig.sizeRange.max) {
      toast.error(`Please enter a valid size between ${catConfig.sizeRange.min} and ${catConfig.sizeRange.max}`);
      return;
    }
    if (gradedSizes.some(gs => gs.sizeNum === sizeNum)) {
      toast.info(`Size ${getSizeLabel(category, sizeNum, sizeSystem)} already generated`);
      return;
    }
    setGenerating(true);
    setTimeout(() => {
      const newGraded: GradedSize = {
        size: getSizeLabel(category, sizeNum, sizeSystem),
        sizeNum,
        measurements: gradeForSize(sizeNum),
      };
      setGradedSizes(prev => [...prev, newGraded].sort((a, b) => a.sizeNum - b.sizeNum));
      addGradedSize(newGraded);
      setTargetSize("");
      setGenerating(false);
      toast.success(`Measurements generated for ${newGraded.size}`);
    }, 800);
  };

  const handleQuickGenerate = (s: number) => {
    if (gradedSizes.some(gs => gs.sizeNum === s)) return;
    const label = getSizeLabel(category, s, sizeSystem);
    const newGraded: GradedSize = { size: label, sizeNum: s, measurements: gradeForSize(s) };
    setGradedSizes(prev => [...prev, newGraded].sort((a, b) => a.sizeNum - b.sizeNum));
    addGradedSize(newGraded);
    toast.success(`${label} generated`);
  };

  const handleDownloadCSV = () => {
    if (gradedSizes.length === 0) {
      toast.error("No sizes generated yet");
      return;
    }
    const unit = catConfig.measurements[0]?.unit || "mm";
    const headers = ["Size", ...Object.values(measurementLabels)];
    const rows = gradedSizes.map(gs => [
      gs.size,
      ...Object.keys(baseMeasurements).map(k => `${gs.measurements[k]} ${unit}`),
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "size-grading.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  };

  const unit = catConfig.measurements[0]?.unit || "mm";

  return (
    <div className="space-y-6">
      {/* Base info */}
      <div className="glass rounded-lg p-5">
        <div className="flex items-center gap-3 mb-4">
          <Ruler className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">Size Grading — {catConfig.label}</h3>
        </div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            Base size: <span className="text-primary font-mono">{getSizeLabel(category, baseSizeNum, sizeSystem)}</span>. Generate measurements for target sizes using linear grading rules.
          </p>
          {projectId && <LiveMeasurementPanel projectId={projectId} category={category} baseSize={baseSize} sizeSystem={sizeSystem} />}
        </div>

        <div className="flex items-end gap-4">
          <div className="space-y-2 flex-1">
            <Label className="text-xs">
              {category === "footwear" ? `Target Size (${sizeSystem})` : "Target Size Index (0=XS … 5=XXL)"}
            </Label>
            <Input
              value={targetSize}
              onChange={e => setTargetSize(e.target.value)}
              placeholder={category === "footwear" ? "e.g. 42" : "e.g. 4"}
              className="font-mono"
              type="number"
              min={catConfig.sizeRange.min}
              max={catConfig.sizeRange.max}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Ruleset</Label>
            <Select value={ruleset} onValueChange={setRuleset}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default Linear</SelectItem>
                <SelectItem value="custom">Custom Rules</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="glow-primary" disabled={!targetSize || generating} onClick={handleGenerate}>
            {generating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <ArrowRight className="w-3 h-3 mr-1" />}
            {generating ? "Generating…" : "Generate for Size"}
          </Button>
        </div>
      </div>

      {/* Quick generate */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground font-mono self-center mr-2">Quick:</span>
        {catConfig.quickSizes.map(s => (
          <Button
            key={s}
            variant="outline"
            size="sm"
            className="text-xs font-mono h-7"
            disabled={gradedSizes.some(gs => gs.sizeNum === s)}
            onClick={() => handleQuickGenerate(s)}
          >
            {getSizeLabel(category, s, sizeSystem)}
          </Button>
        ))}
      </div>

      {/* Generated sizes */}
      {gradedSizes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-foreground">
              Generated Sizes ({gradedSizes.length})
            </h3>
            <Button size="sm" variant="outline" onClick={handleDownloadCSV}>
              <Download className="w-3 h-3 mr-1" />
              Export CSV
            </Button>
          </div>

          <div className="glass rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="font-mono text-xs sticky left-0 bg-background z-10">Parameter</TableHead>
                  <TableHead className="font-mono text-xs text-center">
                    {getSizeLabel(category, baseSizeNum, sizeSystem)}
                    <br />
                    <span className="text-muted-foreground">(Base)</span>
                  </TableHead>
                  {gradedSizes.map(gs => (
                    <TableHead key={gs.sizeNum} className="font-mono text-xs text-center">
                      {gs.size}
                      <br />
                      <Badge variant="secondary" className="bg-success/10 text-success text-[10px] mt-1">
                        Graded
                      </Badge>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(measurementLabels).map(([key, label]) => (
                  <TableRow key={key} className="border-border">
                    <TableCell className="text-sm font-medium sticky left-0 bg-background z-10">
                      {label}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground text-center">
                      {baseMeasurements[key]} {unit}
                    </TableCell>
                    {gradedSizes.map(gs => (
                      <TableCell key={gs.sizeNum} className="font-mono text-sm text-primary text-center">
                        {gs.measurements[key]} {unit}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SizesTab;
