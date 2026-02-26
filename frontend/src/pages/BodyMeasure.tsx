import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Ruler, Camera, CheckCircle2 } from "lucide-react";
import { getCategoryConfig, type CategoryKey } from "@/config/categoryConfig";

const BodyMeasure = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get("projectId");
  const category = (queryParams.get("category") as CategoryKey) || "footwear";

  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [measurements, setMeasurements] = useState<any>(null);

  const catConfig = getCategoryConfig(category);

  useEffect(() => {
    if (!projectId) {
      toast.error("No project ID found");
      navigate("/dashboard");
      return;
    }

    const fetchSession = async () => {
      try {
        const { data } = await api.get(`/measurements/${projectId}`);
        if (data && data.length > 0) {
          setSession(data[0]);
          setMeasurements(data[0].measurements);
        }
      } catch (error) {
        console.error("Failed to fetch session", error);
      }
    };

    fetchSession();
  }, [projectId, navigate]);

  const handleStartMeasurement = async () => {
    setLoading(true);
    try {
      // Create a new measurement session
      const { data } = await api.post("/measurements", {
        projectId,
        category,
        status: "pending",
        height_cm: 170, // Default height or get from user
      });
      setSession(data);
      toast.success("Measurement session started");
    } catch (error) {
      toast.error("Failed to start session");
    } finally {
      setLoading(false);
    }
  };

  const simulateMeasurements = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const mockMeasurements: any = {};
      catConfig.measurements.forEach((m: any) => {
        mockMeasurements[m.key] = Math.round((Math.random() * 20 + 20) * 10) / 10;
      });

      // Update session with measurements
      const { data } = await api.post("/measurements", {
        projectId,
        category,
        status: "completed",
        height_cm: 170,
        measurements: mockMeasurements,
      });

      setSession(data);
      setMeasurements(data.measurements);
      toast.success("Measurements captured!");
    } catch (error) {
      toast.error("Failed to capture measurements");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8 max-w-2xl px-4">
      <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Project
      </Button>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Live Measurement</h1>
          <p className="text-muted-foreground mt-2">Capture precise measurements using AI and your camera.</p>
        </div>

        <div className="glass p-8 rounded-xl text-center space-y-6">
          {!session ? (
            <>
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Ruler className="w-10 h-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Ready to begin?</h2>
                <p className="text-sm text-muted-foreground">Follow the on-screen instructions for the best results. Ensure you are in a well-lit area.</p>
              </div>
              <Button onClick={handleStartMeasurement} disabled={loading} size="lg" className="w-full glow-primary">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />}
                Start AI Scan
              </Button>
            </>
          ) : measurements ? (
            <>
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-600">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Measurements Captured!</h2>
                <p className="text-sm text-muted-foreground">We've successfully processed your body scan for {catConfig.label}.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-left">
                {Object.entries(measurements).map(([key, val]: [string, any]) => (
                  <div key={key} className="p-3 bg-secondary/30 rounded-lg border border-border/50">
                    <p className="text-[10px] font-mono text-muted-foreground uppercase">{key.replace(/_/g, " ")}</p>
                    <p className="text-sm font-semibold">{val} cm</p>
                  </div>
                ))}
              </div>
              <Button onClick={() => navigate(`/project/${projectId}`)} size="lg" className="w-full">
                View Tech Pack
              </Button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Analyzing Scan…</h2>
                <p className="text-sm text-muted-foreground">Processing image markers and calculating dimensions.</p>
              </div>
              <Button onClick={simulateMeasurements} disabled={loading} size="lg" className="w-full">
                Simulate Capture
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BodyMeasure;
