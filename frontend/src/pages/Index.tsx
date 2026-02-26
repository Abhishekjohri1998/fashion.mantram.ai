import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Box, FileText, Ruler, Layers, Zap, Shield } from "lucide-react";

const features = [
  {
    icon: Box,
    title: "3D Reconstruction",
    description: "Upload shoe images from multiple angles and generate accurate 3D models instantly.",
  },
  {
    icon: Ruler,
    title: "CAD Generation",
    description: "Export precise DXF/STEP files ready for manufacturing workflows.",
  },
  {
    icon: FileText,
    title: "Tech Pack Builder",
    description: "Auto-generate comprehensive tech packs with measurements, materials, and construction notes.",
  },
  {
    icon: Layers,
    title: "Size Grading",
    description: "Convert any base size to target sizes using configurable grading rules.",
  },
  {
    icon: Zap,
    title: "Job Pipeline",
    description: "Track every generation step with real-time progress and status updates.",
  },
  {
    icon: Shield,
    title: "Approval Workflow",
    description: "Review, approve, or reject each artifact with version tracking and comments.",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Box className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg text-foreground">SoleCraft</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="glow-primary">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
              Footwear Engineering Platform
            </div>
            
            <h1 className="text-5xl md:text-7xl font-display font-black tracking-tight mb-6 text-foreground">
              From Photo to
              <span className="text-gradient-primary block">Production</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
              Upload shoe images. Get 3D models, CAD files, tech packs, and size-graded outputs — all in one pipeline.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="glow-primary text-base px-8 h-12">
                  Start Building
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="text-base px-8 h-12">
                  View Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 relative">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 text-foreground">
              Full Pipeline, One Platform
            </h2>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto">
              Everything you need to go from reference images to production-ready specifications.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="group glass rounded-lg p-6 hover:border-primary/30 transition-all duration-300"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative">
        <div className="container">
          <div className="relative rounded-xl border border-primary/20 bg-primary/5 p-12 text-center overflow-hidden">
            <div className="absolute inset-0 grid-pattern opacity-20" />
            <div className="relative">
              <h2 className="text-3xl font-display font-bold mb-4 text-foreground">
                Ready to digitize your footwear workflow?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Join teams using SoleCraft to accelerate their product development cycle.
              </p>
              <Link to="/signup">
                <Button size="lg" className="glow-primary px-8 h-12">
                  Get Started Free
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex items-center justify-between text-sm text-muted-foreground">
          <span className="font-mono">© 2026 SoleCraft</span>
          <span className="font-mono text-xs">v1.0.0-mvp</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
