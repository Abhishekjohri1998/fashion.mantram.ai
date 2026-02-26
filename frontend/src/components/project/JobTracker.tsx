import { Check, Loader2, Clock, AlertCircle } from "lucide-react";

export interface Job {
  id: string;
  type: string;
  status: "completed" | "processing" | "queued" | "failed";
  progress: number;
}

interface JobTrackerProps {
  jobs: Job[];
}

const statusIcons = {
  completed: <Check className="w-3.5 h-3.5 text-success" />,
  processing: <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />,
  queued: <Clock className="w-3.5 h-3.5 text-muted-foreground" />,
  failed: <AlertCircle className="w-3.5 h-3.5 text-destructive" />,
};

const JobTracker = ({ jobs }: JobTrackerProps) => {
  return (
    <div className="border-b bg-card/50">
      <div className="container py-4">
        <div className="flex items-center gap-6">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Pipeline</span>
          <div className="flex items-center gap-1 flex-1">
            {jobs.map((job, i) => (
              <div key={job.id} className="flex items-center flex-1">
                <div className="flex items-center gap-2 flex-1">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono ${
                    job.status === "completed" ? "bg-success/10 text-success" :
                    job.status === "processing" ? "bg-primary/10 text-primary" :
                    job.status === "failed" ? "bg-destructive/10 text-destructive" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {statusIcons[job.status]}
                    <span>{job.type}</span>
                    {job.status === "processing" && <span className="ml-1">{job.progress}%</span>}
                  </div>
                </div>
                {i < jobs.length - 1 && (
                  <div className={`w-8 h-px mx-1 ${
                    job.status === "completed" ? "bg-success/30" : "bg-border"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobTracker;
