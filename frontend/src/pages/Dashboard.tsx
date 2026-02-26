import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Box, Plus, Folder, Clock, CheckCircle, AlertCircle, LogOut, Loader2, LayoutGrid, List, Search, Filter, Image as ImageIcon, Layers, TrendingUp, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CATEGORY_LIST, getCategoryConfig, type CategoryKey } from "@/config/categoryConfig";

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
  updatedAt: string;
}

const statusConfig: Record<string, { label: string; icon: any; className: string; dot: string }> = {
  draft: { label: "Draft", icon: Clock, className: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  processing: { label: "Processing", icon: AlertCircle, className: "bg-warning/10 text-warning", dot: "bg-warning" },
  ready: { label: "Ready", icon: CheckCircle, className: "bg-success/10 text-success", dot: "bg-success" },
  in_revision: { label: "In Revision", icon: AlertCircle, className: "bg-destructive/10 text-destructive", dot: "bg-destructive" },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [category, setCategory] = useState<CategoryKey>("footwear");
  const [workflowMode, setWorkflowMode] = useState<"from_photos" | "from_sketch">("from_photos");
  const [baseSize, setBaseSize] = useState("");
  const [sizeSystem, setSizeSystem] = useState("EU");
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);

  const catConfig = getCategoryConfig(category);

  useEffect(() => {
    setBaseSize(catConfig.defaultBaseSize);
    setSizeSystem(catConfig.sizeSystems[0]);
    setMeasurements({});
  }, [category]);

  useEffect(() => {
    if (!user) return;
    loadProjects();
  }, [user]);

  const loadProjects = async () => {
    try {
      const { data } = await api.get("/projects");
      setProjects(data);
      // Thumbnail loading would be implemented differently with Node backend (e.g. via aggregation)
      // For now, we'll keep it as a placeholder or implement a basic version
    } catch (error: any) {
      toast.error("Failed to load projects");
    } finally {
      setLoadingProjects(false);
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterCategory !== "all" && p.category !== filterCategory) return false;
      if (filterStatus !== "all" && p.status !== filterStatus) return false;
      return true;
    });
  }, [projects, searchQuery, filterCategory, filterStatus]);

  const stats = useMemo(() => ({
    total: projects.length,
    ready: projects.filter(p => p.status === "ready").length,
    draft: projects.filter(p => p.status === "draft").length,
    processing: projects.filter(p => p.status === "processing").length,
    categories: [...new Set(projects.map(p => p.category))].length,
  }), [projects]);

  const handleCreateProject = async () => {
    if (!user) return;
    setCreating(true);
    try {
      const { data } = await api.post("/projects", {
        name: projectName,
        category,
        workflow_mode: workflowMode,
        base_size: baseSize,
        size_system: sizeSystem,
        base_measurements: measurements,
      });
      setNewProjectOpen(false);
      setProjectName("");
      navigate(`/project/${data._id}`);
    } catch (error: any) {
      toast.error("Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const getTimeAgo = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b glass sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <Box className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-foreground">SoleCraft Studio</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-mono hidden sm:block">{user?.email}</span>
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => navigate("/profile")}>
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </nav>

      <div className="container py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Projects</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {stats.total} project{stats.total !== 1 ? "s" : ""} · {stats.categories} categor{stats.categories !== 1 ? "ies" : "y"}
            </p>
          </div>

          <Dialog open={newProjectOpen} onOpenChange={setNewProjectOpen}>
            <DialogTrigger asChild>
              <Button className="glow-primary">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="glass max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display">Create New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORY_LIST.map(cat => (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setCategory(cat.key)}
                        className={`rounded-lg border-2 p-3 text-left transition-all ${category === cat.key
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/40"
                          }`}
                      >
                        <p className="text-sm font-semibold text-foreground">{cat.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {cat.measurements.length} measurements · {cat.requiredAngles.length} angles
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Workflow</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setWorkflowMode("from_photos")}
                      className={`rounded-lg border-2 p-3 text-left transition-all ${workflowMode === "from_photos"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/40"
                        }`}
                    >
                      <p className="text-sm font-semibold text-foreground">From Photos</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Upload product photos for processing</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWorkflowMode("from_sketch")}
                      className={`rounded-lg border-2 p-3 text-left transition-all ${workflowMode === "from_sketch"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/40"
                        }`}
                    >
                      <p className="text-sm font-semibold text-foreground">From Sketch</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Upload a sketch to generate realistic views</p>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Project Name</Label>
                  <Input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="Enter project name" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Base Size</Label>
                    <Input value={baseSize} onChange={e => setBaseSize(e.target.value)} placeholder="e.g. 30" />
                  </div>
                  <div className="space-y-2">
                    <Label>Size System</Label>
                    <Select value={sizeSystem} onValueChange={setSizeSystem}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {catConfig.sizeSystems.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleCreateProject} className="w-full glow-primary" disabled={!projectName || !baseSize || creating}>
                  {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Create Project
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total", value: stats.total, icon: Layers, color: "text-primary" },
            { label: "Ready", value: stats.ready, icon: CheckCircle, color: "text-success" },
            { label: "Drafts", value: stats.draft, icon: Clock, color: "text-muted-foreground" },
            { label: "Processing", value: stats.processing, icon: TrendingUp, color: "text-warning" },
          ].map(stat => (
            <div key={stat.label} className="glass rounded-lg p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-secondary flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-foreground leading-none">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search projects…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 bg-secondary border-border"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[130px] bg-secondary border-border">
                <Filter className="w-3 h-3 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORY_LIST.map(c => (
                  <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center border border-border rounded-md overflow-hidden">
              <button onClick={() => setViewMode("grid")} className={`p-2 ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode("list")} className={`p-2 ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {loadingProjects ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="glass rounded-lg p-12 text-center">
            <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display font-semibold text-foreground mb-1">No projects found</h3>
            <p className="text-sm text-muted-foreground">Start by creating a new design project</p>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-2"}>
            {filteredProjects.map(project => {
              const status = statusConfig[project.status] || statusConfig.draft;
              const cat = getCategoryConfig(project.category || "footwear");
              return (
                <Link key={project._id} to={`/project/${project._id}`} className="glass rounded-xl overflow-hidden hover:border-primary/40 transition-all p-4 block group">
                  <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors truncate">{project.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-[10px]">{cat.label}</Badge>
                    <Badge variant="outline" className={`text-[10px] ${status.className}`}>{status.label}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-3 font-mono">Updated {getTimeAgo(project.updatedAt)}</p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
