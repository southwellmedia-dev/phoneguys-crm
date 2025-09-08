"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { 
  MessageSquare,
  FileText,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  Timer,
  Plus,
  Send,
  Calendar,
  Star,
  Activity,
  Zap,
  Package
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Note {
  id: string;
  content: string;
  note_type: "internal" | "customer" | "system";
  is_important?: boolean;
  created_at: string;
  users?: {
    name?: string;
    email?: string;
  };
}

interface ActivityItem {
  id: string;
  type: "note" | "status_change" | "timer" | "assignment" | "service_added";
  content: string;
  metadata?: any;
  created_at: string;
  user?: {
    name?: string;
    email?: string;
  };
}

interface ConnectedActivityFeedProps {
  ticketId: string;
  notes?: Note[];
  activities?: ActivityItem[];
  className?: string;
  showAddNote?: boolean;
}

const activityIcons: Record<string, any> = {
  note: MessageSquare,
  status_change: Activity,
  timer: Timer,
  assignment: User,
  service_added: Package,
  default: Zap
};

const activityColors: Record<string, string> = {
  note: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20",
  status_change: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/20",
  timer: "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/20",
  assignment: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20",
  service_added: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20",
  default: "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/20"
};

export function ConnectedActivityFeed({ 
  ticketId, 
  notes = [], 
  activities = [],
  className,
  showAddNote = true
}: ConnectedActivityFeedProps) {
  const queryClient = useQueryClient();
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState<"internal" | "customer">("internal");
  const [isImportant, setIsImportant] = useState(false);

  // Combine notes and activities into a single timeline
  const timelineItems = [
    ...notes.map(note => ({
      ...note,
      type: "note" as const,
      timestamp: note.created_at
    })),
    ...(activities || []).map(activity => ({
      ...activity,
      timestamp: activity.created_at
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/orders/${ticketId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: noteContent,
          note_type: noteType,
          is_important: isImportant
        })
      });
      
      if (!response.ok) throw new Error('Failed to add note');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      toast.success('Note added successfully');
      setNoteContent("");
      setIsAddingNote(false);
      setIsImportant(false);
    },
    onError: () => {
      toast.error('Failed to add note');
    }
  });

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 1000 / 60 / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const minutes = Math.floor(diff / 1000 / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
  };

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            Activity & Notes
          </CardTitle>
          {showAddNote && !isAddingNote && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingNote(true)}
              className="h-8"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Note
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Add Note Form */}
        <AnimatePresence>
          {isAddingNote && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 p-4 rounded-lg bg-muted/50 border"
            >
              <div className="flex items-center gap-2">
                <Button
                  variant={noteType === "internal" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNoteType("internal")}
                  className="h-7"
                >
                  Internal
                </Button>
                <Button
                  variant={noteType === "customer" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNoteType("customer")}
                  className="h-7"
                >
                  Customer
                </Button>
                <Button
                  variant={isImportant ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsImportant(!isImportant)}
                  className={cn("h-7 ml-auto", isImportant && "bg-amber-500 hover:bg-amber-600")}
                >
                  <Star className={cn("h-3.5 w-3.5", isImportant && "fill-current")} />
                  Important
                </Button>
              </div>
              
              <Textarea
                placeholder="Enter your note..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="min-h-[100px] resize-none"
                autoFocus
              />
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => addNoteMutation.mutate()}
                  disabled={!noteContent.trim() || addNoteMutation.isPending}
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                >
                  {addNoteMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Adding...
                    </span>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5 mr-1" />
                      Add Note
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAddingNote(false);
                    setNoteContent("");
                    setIsImportant(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timeline */}
        {timelineItems.length > 0 ? (
          <div className="relative space-y-4">
            {/* Timeline Line */}
            <div className="absolute left-6 top-8 bottom-0 w-0.5 bg-gradient-to-b from-primary/20 via-primary/10 to-transparent" />
            
            {timelineItems.map((item, index) => {
              const Icon = item.type === "note" 
                ? MessageSquare 
                : activityIcons[item.type] || activityIcons.default;
              const colorClass = item.type === "note"
                ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20"
                : activityColors[item.type] || activityColors.default;
              
              const isNote = item.type === "note";
              const note = isNote ? item as Note : null;
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative flex gap-4"
                >
                  {/* Timeline Node */}
                  <div className={cn(
                    "relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-4 border-background",
                    colorClass
                  )}>
                    <Icon className="h-5 w-5" />
                    {note?.is_important && (
                      <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-amber-500 flex items-center justify-center">
                        <Star className="h-3 w-3 text-white fill-current" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <div className={cn(
                      "rounded-lg border p-4",
                      note?.is_important 
                        ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50"
                        : "bg-muted/30"
                    )}>
                      {/* Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {item.user?.name || item.user?.email || "System"}
                          </span>
                          {note && (
                            <Badge variant="secondary" className="text-xs">
                              {note.note_type}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(item.timestamp)}
                        </span>
                      </div>

                      {/* Content */}
                      <p className="text-sm text-foreground">
                        {item.content}
                      </p>

                      {/* Metadata */}
                      {item.metadata && (
                        <div className="mt-2 pt-2 border-t">
                          {Object.entries(item.metadata).map(([key, value]) => (
                            <div key={key} className="text-xs text-muted-foreground">
                              <span className="font-medium">{key}:</span> {String(value)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4 mx-auto w-fit">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Activity Yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Notes and activities will appear here as they are added.
            </p>
            {showAddNote && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setIsAddingNote(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Note
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}