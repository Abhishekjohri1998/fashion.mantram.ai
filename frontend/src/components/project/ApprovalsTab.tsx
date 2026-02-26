import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, MessageSquare, FileCode, Box, FileText } from "lucide-react";

const artifacts = [
  { id: "1", name: "3D Model (GLB)", type: "glb_3d", icon: Box, version: 1, status: "approved" },
  { id: "2", name: "Sole Outline (DXF)", type: "cad_dxf", icon: FileCode, version: 1, status: "approved" },
  { id: "3", name: "Tech Pack (PDF)", type: "techpack_pdf", icon: FileText, version: 2, status: "needs_changes" },
  { id: "4", name: "Full Assembly (STEP)", type: "cad_step", icon: FileCode, version: 1, status: "pending" },
];

const statusStyles = {
  approved: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
  needs_changes: "bg-warning/10 text-warning",
  pending: "bg-muted text-muted-foreground",
};

const statusLabels = {
  approved: "Approved",
  rejected: "Rejected",
  needs_changes: "Needs Changes",
  pending: "Pending Review",
};

const ApprovalsTab = () => {
  const [comment, setComment] = useState("");

  return (
    <div className="space-y-4">
      <h3 className="font-display font-semibold text-foreground">Artifact Approvals</h3>

      <div className="space-y-3">
        {artifacts.map(artifact => (
          <div key={artifact.id} className="glass rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center">
                  <artifact.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">{artifact.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">v{artifact.version}</p>
                </div>
              </div>
              <Badge variant="secondary" className={statusStyles[artifact.status as keyof typeof statusStyles]}>
                {statusLabels[artifact.status as keyof typeof statusLabels]}
              </Badge>
            </div>

            {artifact.status === "pending" && (
              <div className="space-y-3 pt-3 border-t border-border">
                <Textarea
                  placeholder="Add a comment (optional)..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  className="text-sm"
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground">
                    <Check className="w-3 h-3 mr-1" />
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" className="text-warning border-warning/30 hover:bg-warning/10">
                    <MessageSquare className="w-3 h-3 mr-1" />
                    Needs Changes
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                    <X className="w-3 h-3 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            )}

            {artifact.status === "needs_changes" && (
              <div className="pt-3 border-t border-border">
                <div className="glass rounded-md p-3">
                  <p className="text-xs text-muted-foreground font-mono mb-1">Comment by John · Feb 21</p>
                  <p className="text-sm text-foreground">Heel measurement seems off — please verify against the physical sample.</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApprovalsTab;
