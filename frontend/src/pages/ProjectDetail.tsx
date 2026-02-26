import { useState, useCallback, useRef, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Box, ArrowLeft, Play, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import UploadsTab from "@/components/project/UploadsTab";
import PreviewTab from "@/components/project/PreviewTab";
import CadTab from "@/components/project/CadTab";
import TechPackTab from "@/components/project/TechPackTab";
import SizesTab from "@/components/project/SizesTab";
import CustomizeTab from "@/components/project/CustomizeTab";
import ApprovalsTab from "@/components/project/ApprovalsTab";
import SketchTab from "@/components/project/SketchTab";
import GeneratedViewsTab from "@/components/project/GeneratedViewsTab";
import JobTracker, { Job } from "@/components/project/JobTracker";
import { ProjectUploadsProvider } from "@/components/project/ProjectUploadsContext";
import { CustomizationProvider } from "@/components/project/CustomizationContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { getCategoryConfig, type CategoryKey } from "@/config/categoryConfig";

const initialJobs: Job[] = [
  { id: "1", type: "3D Reconstruction", status: "queued", progress: 0 },
  { id: "2", type: "Part Segmentation", status: "queued", progress: 0 },
  { id: "3", type: "CAD Generation", status: "queued", progress: 0 },
  { id: "4", type: "Tech Pack Generation", status: "queued", progress: 0 },
];

interface Project {
  _id: string;
  name: string;
  status: string;
  category: string;
  workflow_mode: string;
  base_size: string;
  size_system: string;
  base_measurements: Record<string, number>;
  createdAt: string;
}

const statusLabels: Record<string, string> = {
  draft: "Draft",
  processing: "Processing",
  ready: "Ready",
};

const ProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showJobs, setShowJobs] = useState(false);
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [isGenerating, setIsGenerating] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchProject = async () => {
      try {
        const { data } = await api.get(`/projects/${id}`);
        setProject(data);
      } catch (error: any) {
        toast.error("Failed to load project details");
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  const catConfig = project ? getCategoryConfig(project.category || "footwear") : null;

  const runPipeline = useCallback(() => {
    if (isGenerating) return;
    setIsGenerating(true);
    setShowJobs(true);
    const freshJobs = initialJobs.map(j => ({ ...j, status: "queued" as const, progress: 0 }));
    setJobs(freshJobs);
    toast.info("Pipeline started — simulating stages");

    let currentJob = 0;
    let progress = 0;

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      progress += Math.floor(Math.random() * 20) + 15;

      if (progress >= 100) {
        setJobs(prev => prev.map((j, i) =>
          i === currentJob ? { ...j, status: "completed" as const, progress: 100 } :
            i === currentJob + 1 ? { ...j, status: "processing" as const, progress: 0 } : j
        ));
        currentJob++;
        progress = 0;

        if (currentJob >= initialJobs.length) {
          if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
          setIsGenerating(false);
          toast.success("Pipeline simulation complete! Use Customize & Tech Pack tabs for real AI generation.");
          return;
        }
      } else {
        setJobs(prev => prev.map((j, i) =>
          i === currentJob ? { ...j, status: "processing" as const, progress: Math.min(progress, 99) } : j
        ));
      }
    }, 300);
  }, [isGenerating]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Project not found</p>
          <Link to="/dashboard"><Button variant="outline">Back to Dashboard</Button></Link>
        </div>
      </div>
    );
  }

  const category = (project.category || "footwear") as CategoryKey;
  const isSketchMode = (project as any).workflow_mode === "from_sketch";

  return (
    <ProjectUploadsProvider projectId={project._id}>
      <CustomizationProvider projectId={project._id}>
        <div className="min-h-screen bg-background">
          <nav className="border-b glass sticky top-0 z-50">
            <div className="container flex items-center justify-between h-14">
              <div className="flex items-center gap-3">
                <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                    <Box className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                  <span className="font-display font-bold text-foreground">{project.name}</span>
                </div>
                <Badge variant="secondary" className="bg-success/10 text-success text-xs">
                  {statusLabels[project.status] || project.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowJobs(!showJobs)}>
                  Jobs
                </Button>
                <Button size="sm" className="glow-primary" onClick={runPipeline} disabled={isGenerating}>
                  {isGenerating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Play className="w-3 h-3 mr-1" />}
                  {isGenerating ? "Generating…" : "Generate Package"}
                </Button>
              </div>
            </div>
          </nav>

          {showJobs && <JobTracker jobs={jobs} />}

          <div className="container py-6">
            <div className="flex items-center gap-4 mb-6 text-sm font-mono text-muted-foreground">
              <span>Category: {catConfig?.label}</span>
              <span className="text-border">|</span>
              <span>Base: {project.size_system} {project.base_size}</span>
              <span className="text-border">|</span>
              <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
            </div>

            <Tabs defaultValue={isSketchMode ? "sketch" : "uploads"} className="w-full">
              <TabsList className="bg-secondary border border-border mb-6">
                <TabsTrigger value={isSketchMode ? "sketch" : "uploads"}>{isSketchMode ? "Sketch" : "Uploads"}</TabsTrigger>
                {!isSketchMode && <TabsTrigger value="preview">3D Preview</TabsTrigger>}
                {!isSketchMode && <TabsTrigger value="cad">CAD</TabsTrigger>}
                {isSketchMode && <TabsTrigger value="generated_views">Generated Views</TabsTrigger>}
                <TabsTrigger value="customize">Customize</TabsTrigger>
                <TabsTrigger value="techpack">Tech Pack</TabsTrigger>
                <TabsTrigger value="sizes">Sizes</TabsTrigger>
                <TabsTrigger value="approvals">Approvals</TabsTrigger>
              </TabsList>

              {isSketchMode ? (
                <>
                  <TabsContent value="sketch"><SketchTab category={category} /></TabsContent>
                  <TabsContent value="generated_views"><GeneratedViewsTab category={category} /></TabsContent>
                  <TabsContent value="customize"><CustomizeTab category={category} isSketchMode /></TabsContent>
                  <TabsContent value="techpack"><TechPackTab category={category} baseSize={project.base_size} sizeSystem={project.size_system} /></TabsContent>
                  <TabsContent value="sizes"><SizesTab category={category} baseSize={project.base_size} sizeSystem={project.size_system} projectId={project._id} /></TabsContent>
                  <TabsContent value="approvals"><ApprovalsTab /></TabsContent>
                </>
              ) : (
                <>
                  <TabsContent value="uploads"><UploadsTab category={category} /></TabsContent>
                  <TabsContent value="preview"><PreviewTab /></TabsContent>
                  <TabsContent value="cad"><CadTab /></TabsContent>
                  <TabsContent value="techpack"><TechPackTab category={category} baseSize={project.base_size} sizeSystem={project.size_system} /></TabsContent>
                  <TabsContent value="sizes"><SizesTab category={category} baseSize={project.base_size} sizeSystem={project.size_system} projectId={project._id} /></TabsContent>
                  <TabsContent value="customize"><CustomizeTab category={category} /></TabsContent>
                  <TabsContent value="approvals"><ApprovalsTab /></TabsContent>
                </>
              )}
            </Tabs>
          </div>
        </div>
      </CustomizationProvider>
    </ProjectUploadsProvider>
  );
};

export default ProjectDetail;
