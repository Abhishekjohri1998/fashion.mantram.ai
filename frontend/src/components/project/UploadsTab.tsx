import { useState, useRef } from "react";
import { Upload, Check, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useProjectUploads } from "./ProjectUploadsContext";
import { getCategoryConfig, type CategoryKey } from "@/config/categoryConfig";

interface AngleItem {
  key: string;
  label: string;
}

interface UploadsTabProps {
  category: CategoryKey;
}

const UploadsTab = ({ category }: UploadsTabProps) => {
  const { images, addImage } = useProjectUploads();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeAngle, setActiveAngle] = useState<AngleItem | null>(null);

  const catConfig = getCategoryConfig(category);
  const requiredAngles = catConfig.requiredAngles;
  const optionalAngles = catConfig.optionalAngles;

  const isUploaded = (key: string) => images.some(i => i.key === key);
  const getPreview = (key: string) => images.find(i => i.key === key)?.preview;
  const uploaded = requiredAngles.filter(a => isUploaded(a.key)).length;
  const total = requiredAngles.length;

  const handleUploadClick = (angle: AngleItem) => {
    setActiveAngle(angle);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeAngle) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    addImage(
      {
        key: activeAngle.key,
        label: activeAngle.label,
        preview: previewUrl,
        angleType: activeAngle.key,
      },
      file
    );

    toast.success(`${file.name} uploaded`);
    setActiveAngle(null);
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileChange} />

      {/* Progress */}
      <div className="glass rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold text-foreground">Required Angles — {catConfig.label}</h3>
          <span className="font-mono text-sm text-muted-foreground">{uploaded}/{total} uploaded</span>
        </div>
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(uploaded / total) * 100}%` }} />
        </div>
      </div>

      {/* Required angles grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {requiredAngles.map(angle => {
          const done = isUploaded(angle.key);
          const preview = getPreview(angle.key);
          return (
            <div
              key={angle.key}
              className={`glass rounded-lg p-4 text-center transition-all ${done ? "border-success/30" : "border-dashed border-border hover:border-primary/30"}`}
            >
              <div className={`w-full aspect-[4/3] rounded-md mb-3 flex items-center justify-center overflow-hidden ${done ? "bg-success/5" : "bg-secondary"}`}>
                {preview ? (
                  <img src={preview} alt={angle.label} className="w-full h-full object-cover" />
                ) : done ? (
                  <Check className="w-8 h-8 text-success" />
                ) : (
                  <Image className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <p className="text-sm font-medium text-foreground">{angle.label}</p>
              {done ? (
                <Badge variant="secondary" className="mt-2 bg-success/10 text-success text-xs">Uploaded</Badge>
              ) : (
                <Button variant="outline" size="sm" className="mt-2 text-xs" onClick={() => handleUploadClick(angle)}>
                  <Upload className="w-3 h-3 mr-1" />
                  Upload
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Optional */}
      <div>
        <h3 className="font-display font-semibold text-foreground mb-3">Optional Closeups</h3>
        <div className="grid grid-cols-3 gap-4">
          {optionalAngles.map(angle => {
            const done = isUploaded(angle.key);
            const preview = getPreview(angle.key);
            return (
              <div key={angle.key} className="glass rounded-lg p-4 text-center border-dashed hover:border-primary/30 transition-all">
                <div className="w-full aspect-[4/3] rounded-md mb-3 flex items-center justify-center overflow-hidden bg-secondary">
                  {preview ? (
                    <img src={preview} alt={angle.label} className="w-full h-full object-cover" />
                  ) : (
                    <Image className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <p className="text-xs font-medium text-foreground">{angle.label}</p>
                {done ? (
                  <Badge variant="secondary" className="mt-2 bg-success/10 text-success text-xs">Uploaded</Badge>
                ) : (
                  <Button variant="ghost" size="sm" className="mt-2 text-xs text-muted-foreground" onClick={() => handleUploadClick(angle)}>
                    <Upload className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default UploadsTab;
