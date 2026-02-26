import { Download, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const cadFiles = [
  { name: "sole_outline.dxf", type: "DXF", size: "340 KB", version: 1, status: "generated" },
  { name: "upper_pattern.dxf", type: "DXF", size: "520 KB", version: 1, status: "generated" },
  { name: "full_assembly.step", type: "STEP", size: "4.2 MB", version: 1, status: "generated" },
];

const CadTab = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-foreground">CAD Exports</h3>
        <Button size="sm" className="glow-primary">
          <Download className="w-3 h-3 mr-1" />
          Download All
        </Button>
      </div>

      <div className="space-y-3">
        {cadFiles.map(file => (
          <div key={file.name} className="glass rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-secondary flex items-center justify-center">
                <FileCode className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-mono text-sm font-medium text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {file.type} · {file.size} · v{file.version}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-success/10 text-success text-xs">Generated</Badge>
              <Button variant="outline" size="sm">
                <Download className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CadTab;
