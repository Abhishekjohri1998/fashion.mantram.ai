import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ShoppingBag, Heart } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

const SharedDeckPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [deck, setDeck] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;

    const fetchDeck = async () => {
      try {
        const { data } = await api.get(`/shared-decks/${token}`);
        setDeck(data);

        // Fetch assets for this project
        const { data: assetData } = await api.get(`/customization-assets/${data.project._id}`);
        setAssets(assetData.filter((a: any) => a.asset_type === "customized_image"));
      } catch (error) {
        toast.error("Invalid or expired share link");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchDeck();
  }, [token, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!deck) return null;

  return (
    <div className="min-h-screen bg-secondary/5">
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <h1 className="font-display font-bold text-xl">{deck.project.name} — Design Deck</h1>
          </div>
          <Button size="sm" className="glow-primary">
            Approve Design
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {assets.map((asset, idx) => (
            <div key={asset._id} className="group bg-white rounded-2xl border border-border/50 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="aspect-square relative overflow-hidden">
                <img src={asset.url} alt="Design" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute top-4 right-4">
                  <Button variant="secondary" size="icon" className="rounded-full bg-white/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">{asset.metadata?.sourceLabel || "Original Design"}</h3>
                  <div className="w-6 h-6 rounded-full border border-border shadow-inner" style={{ backgroundColor: asset.metadata?.colorHex }} />
                </div>
                <p className="text-sm text-muted-foreground mb-6 line-clamp-2">
                  Material: <span className="text-foreground font-medium">{asset.metadata?.materialLabel || "Standard"}</span>
                </p>
                <Button className="w-full gap-2" variant="outline">
                  <ShoppingBag className="w-4 h-4" /> View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default SharedDeckPage;
