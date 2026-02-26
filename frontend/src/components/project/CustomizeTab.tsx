import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Share2, Copy } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useCustomization } from "./CustomizationContext";

interface CustomizeTabProps {
  projectId: string;
}

const CustomizeTab = ({ projectId }: CustomizeTabProps) => {
  const { customizedImages } = useCustomization();
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const handleShare = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/shared-decks", { projectId });
      const url = `${window.location.origin}/share/${data.token}`;
      setShareUrl(url);

      if (navigator.share) {
        await navigator.share({
          title: "Check out my design",
          url: url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Share link copied to clipboard!");
      }
    } catch (error) {
      toast.error("Failed to generate share link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-display font-semibold">Customization Deck</h3>
        <Button onClick={handleShare} disabled={loading} className="glow-primary">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Share2 className="w-4 h-4 mr-2" />}
          Share Design
        </Button>
      </div>

      {shareUrl && (
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/10 flex items-center justify-between">
          <p className="text-xs font-mono text-primary truncate mr-4">{shareUrl}</p>
          <Button variant="ghost" size="sm" onClick={() => {
            navigator.clipboard.writeText(shareUrl);
            toast.success("Copied!");
          }}>
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customizedImages.map((img, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-border/50 overflow-hidden shadow-sm">
            <div className="aspect-[4/3] relative">
              <img src={img.url} alt={img.sourceLabel} className="w-full h-full object-cover" />
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{img.sourceLabel}</span>
                <div className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: img.colorHex }} />
              </div>
              <p className="text-xs text-muted-foreground">{img.materialLabel}</p>
            </div>
          </div>
        ))}

        {customizedImages.length === 0 && (
          <div className="col-span-full py-12 text-center bg-secondary/10 rounded-xl border-2 border-dashed border-border/50">
            <p className="text-muted-foreground">Go to the visualizer to customize your product.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomizeTab;
