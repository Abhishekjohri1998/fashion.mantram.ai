import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trash2, Image as ImageIcon } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface SketchTabProps {
  projectId: string;
}

const SketchTab = ({ projectId }: SketchTabProps) => {
  const [loading, setLoading] = useState(false);
  const [sketches, setSketches] = useState<any[]>([]);

  useEffect(() => {
    if (!projectId) return;
    const fetchSketches = async () => {
      try {
        const { data } = await api.get(`/project-uploads/${projectId}`);
        setSketches(data.filter((row: any) => row.angle_key === "sketch" || row.angle_key.includes("sketch")));
      } catch (error) {
        console.error("Failed to fetch sketches", error);
      }
    };
    fetchSketches();
  }, [projectId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !projectId) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const { data: uploadRes } = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { data: sketchRes } = await api.post("/project-uploads", {
        projectId,
        angle_key: `sketch_${Date.now()}`,
        label: "Hand Sketch",
        file_path: uploadRes.filePath,
      });

      setSketches(prev => [...prev, sketchRes]);
      toast.success("Sketch uploaded");
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-display font-semibold">Project Sketches</h3>
        <Button variant="outline" className="relative cursor-pointer" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
          Add Sketch
          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleUpload} disabled={loading} accept="image/*" />
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sketches.map((sketch) => (
          <div key={sketch._id} className="group relative aspect-square bg-secondary/30 rounded-xl border border-border/50 overflow-hidden glass">
            <img src={`${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}${sketch.file_path}`} alt="Sketch" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-mono">{sketch.label}</span>
            </div>
          </div>
        ))}
        {sketches.length === 0 && (
          <div className="col-span-full py-12 text-center bg-secondary/10 rounded-xl border-2 border-dashed border-border/50">
            <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">No sketches uploaded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SketchTab;
