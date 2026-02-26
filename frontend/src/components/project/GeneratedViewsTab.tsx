import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Image as ImageIcon } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface GeneratedViewsTabProps {
  projectId: string;
}

const GeneratedViewsTab = ({ projectId }: GeneratedViewsTabProps) => {
  const [loading, setLoading] = useState(false);
  const [views, setViews] = useState<any[]>([]);

  useEffect(() => {
    if (!projectId) return;
    const fetchViews = async () => {
      try {
        const { data } = await api.get(`/customization-assets/${projectId}`);
        setViews(data.filter((row: any) => row.asset_type === "generated_view" || row.asset_type === "sketch_view"));
      } catch (error) {
        console.error("Failed to fetch views", error);
      }
    };
    fetchViews();
  }, [projectId]);

  const handleGenerateViews = async () => {
    setLoading(true);
    try {
      // Simulate calling an AI generation service via backend
      // In a real app, this would be a POST to /api/generate/views
      const mockViews = [
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400",
        "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=400",
      ];

      for (const view of mockViews) {
        const { data } = await api.post("/customization-assets", {
          projectId,
          asset_type: "generated_view",
          url: view,
          metadata: { generatedAt: new Date().toISOString() },
        });
        setViews(prev => [...prev, data]);
      }
      toast.success("Views generated successfully");
    } catch (error) {
      toast.error("Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-display font-semibold">AI Generated Views</h3>
        <Button onClick={handleGenerateViews} disabled={loading} className="glow-primary">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Generate Views
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        {views.map((view) => (
          <div key={view._id} className="group aspect-video bg-white rounded-xl border border-border/50 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <img src={view.url} alt="Generated View" className="w-full h-full object-cover" />
            <div className="p-3 bg-secondary/10 flex items-center justify-between">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">AI Vision v1</span>
            </div>
          </div>
        ))}
        {views.length === 0 && (
          <div className="col-span-full py-16 text-center">
            <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary/20" />
            </div>
            <p className="text-muted-foreground">Upload sketches and click generate to see AI concepts.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneratedViewsTab;
