"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageSquare, 
  Plus, 
  Send, 
  Edit3, 
  Trash2, 
  User,
  Clock,
  Pin,
  AlertCircle,
  CheckCircle,
  Flag,
  Eye,
  EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Note {
  id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  author: {
    id: string;
    name: string;
    role?: string;
  };
  type?: "note" | "comment" | "warning" | "milestone";
  is_pinned?: boolean;
  is_internal?: boolean; // Only visible to staff
  mentions?: string[]; // User IDs mentioned in note
}

export interface NotesWidgetProps {
  notes: Note[];
  variant?: "default" | "elevated" | "glass" | "compact";
  showAddNote?: boolean;
  showInternalNotes?: boolean;
  currentUserId?: string;
  onAddNote?: (content: string, isInternal: boolean, type: Note["type"]) => void;
  onEditNote?: (noteId: string, content: string) => void;
  onDeleteNote?: (noteId: string) => void;
  onPinNote?: (noteId: string) => void;
  className?: string;
}

export function NotesWidget({
  notes,
  variant = "default",
  showAddNote = true,
  showInternalNotes = false,
  currentUserId,
  onAddNote,
  onEditNote,
  onDeleteNote,
  onPinNote,
  className
}: NotesWidgetProps) {
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteType, setNewNoteType] = useState<Note["type"]>("note");
  const [newNoteIsInternal, setNewNoteIsInternal] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  // Filter notes based on internal visibility
  const visibleNotes = showInternalNotes 
    ? notes 
    : notes.filter(note => !note.is_internal);

  // Sort notes: pinned first, then by date (newest first)
  const sortedNotes = [...visibleNotes].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handleAddNote = () => {
    if (newNoteContent.trim() && onAddNote) {
      onAddNote(newNoteContent.trim(), newNoteIsInternal, newNoteType);
      setNewNoteContent("");
      setIsAddingNote(false);
      setNewNoteType("note");
      setNewNoteIsInternal(false);
    }
  };

  const handleEditNote = (noteId: string) => {
    if (editContent.trim() && onEditNote) {
      onEditNote(noteId, editContent.trim());
      setEditingNoteId(null);
      setEditContent("");
    }
  };

  const startEditing = (note: Note) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
  };

  const getNoteTypeColor = (type?: Note["type"]) => {
    switch (type) {
      case "warning": return "amber";
      case "milestone": return "green";
      case "comment": return "blue";
      default: return "gray";
    }
  };

  const getNoteTypeIcon = (type?: Note["type"]) => {
    switch (type) {
      case "warning": return <AlertCircle className="h-3 w-3" />;
      case "milestone": return <CheckCircle className="h-3 w-3" />;
      case "comment": return <MessageSquare className="h-3 w-3" />;
      default: return <Edit3 className="h-3 w-3" />;
    }
  };

  const formatTimestamp = (dateString: string, updatedString?: string) => {
    const date = new Date(dateString);
    const updated = updatedString ? new Date(updatedString) : null;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    
    let timeStr = "";
    if (diffMinutes < 60) {
      timeStr = `${diffMinutes}m ago`;
    } else if (diffMinutes < 1440) {
      timeStr = `${Math.floor(diffMinutes / 60)}h ago`;
    } else {
      timeStr = date.toLocaleDateString();
    }
    
    return updated && updated.getTime() !== date.getTime() 
      ? `${timeStr} (edited)`
      : timeStr;
  };

  if (variant === "compact") {
    return (
      <Card variant="elevated" className={cn("p-4", className)}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{visibleNotes.length} Notes</h3>
              <p className="text-sm text-muted-foreground">
                {sortedNotes.filter(n => n.is_pinned).length} pinned
              </p>
            </div>
          </div>
          {showAddNote && (
            <Button size="sm" variant="outline" onClick={() => setIsAddingNote(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {sortedNotes.slice(0, 3).map((note) => (
            <div key={note.id} className="text-sm">
              <div className="flex items-start gap-2">
                {note.is_pinned && <Pin className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />}
                {note.is_internal && <EyeOff className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />}
                <div className="flex-1">
                  <p className="line-clamp-2">{note.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {note.author.name} • {formatTimestamp(note.created_at, note.updated_at)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {visibleNotes.length > 3 && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            +{visibleNotes.length - 3} more notes
          </p>
        )}
      </Card>
    );
  }

  return (
    <Card variant={variant} className={cn("overflow-hidden", className)}>
      
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Notes & Comments</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {visibleNotes.length} note{visibleNotes.length !== 1 ? 's' : ''}
                {sortedNotes.filter(n => n.is_pinned).length > 0 && 
                  ` • ${sortedNotes.filter(n => n.is_pinned).length} pinned`
                }
              </p>
            </div>
          </div>
          {showAddNote && !isAddingNote && (
            <Button onClick={() => setIsAddingNote(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          )}
        </div>
      </CardHeader>

      {/* Add Note Form */}
      {isAddingNote && (
        <div className="px-6 pb-6 border-b">
          <div className="space-y-4">
            <Textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Write your note or comment..."
              className="min-h-[100px]"
            />
            
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={newNoteType === "note" ? "solid" : "outline"}
                  color={newNoteType === "note" ? "cyan" : undefined}
                  onClick={() => setNewNoteType("note")}
                >
                  <Edit3 className="h-3 w-3 mr-1" />
                  Note
                </Button>
                <Button
                  size="sm"
                  variant={newNoteType === "comment" ? "solid" : "outline"}
                  color={newNoteType === "comment" ? "cyan" : undefined}
                  onClick={() => setNewNoteType("comment")}
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Comment
                </Button>
                <Button
                  size="sm"
                  variant={newNoteType === "warning" ? "solid" : "outline"}
                  color={newNoteType === "warning" ? "amber" : undefined}
                  onClick={() => setNewNoteType("warning")}
                >
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Warning
                </Button>
                <Button
                  size="sm"
                  variant={newNoteType === "milestone" ? "solid" : "outline"}
                  color={newNoteType === "milestone" ? "green" : undefined}
                  onClick={() => setNewNoteType("milestone")}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Milestone
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newNoteIsInternal}
                    onChange={(e) => setNewNoteIsInternal(e.target.checked)}
                    className="rounded"
                  />
                  <span className="flex items-center gap-1">
                    <EyeOff className="h-3 w-3" />
                    Internal only
                  </span>
                </label>
                <Button 
                  size="sm" 
                  onClick={handleAddNote}
                  disabled={!newNoteContent.trim()}
                >
                  <Send className="h-4 w-4 mr-1" />
                  Post
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddingNote(false);
                    setNewNoteContent("");
                    setNewNoteType("note");
                    setNewNoteIsInternal(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <CardContent>
        {sortedNotes.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-2">No notes yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add notes to track progress and communicate with your team
            </p>
            {showAddNote && (
              <Button onClick={() => setIsAddingNote(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Note
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedNotes.map((note) => (
              <Card
                key={note.id}
                variant="soft"
                className={cn(
                  "p-4 transition-all",
                  note.is_pinned && "ring-2 ring-amber-200 dark:ring-amber-800"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Author Avatar */}
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    
                    {/* Note Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{note.author.name}</span>
                        {note.author.role && (
                          <Badge variant="outline" size="sm">{note.author.role}</Badge>
                        )}
                        {note.type && (
                          <Badge variant="soft" color={getNoteTypeColor(note.type)} size="sm">
                            {getNoteTypeIcon(note.type)}
                            <span className="ml-1 capitalize">{note.type}</span>
                          </Badge>
                        )}
                        {note.is_pinned && (
                          <Badge variant="soft" color="amber" size="sm">
                            <Pin className="h-3 w-3 mr-1" />
                            Pinned
                          </Badge>
                        )}
                        {note.is_internal && (
                          <Badge variant="soft" color="gray" size="sm">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Internal
                          </Badge>
                        )}
                      </div>
                      
                      {editingNoteId === note.id ? (
                        <div className="space-y-3">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[80px]"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleEditNote(note.id)}>
                              Save
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => {
                                setEditingNoteId(null);
                                setEditContent("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="whitespace-pre-wrap mb-2">{note.content}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimestamp(note.created_at, note.updated_at)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  {editingNoteId !== note.id && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onPinNote && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onPinNote(note.id)}
                          className={note.is_pinned ? "text-amber-600" : ""}
                        >
                          <Pin className="h-4 w-4" />
                        </Button>
                      )}
                      {onEditNote && note.author.id === currentUserId && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing(note)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      )}
                      {onDeleteNote && note.author.id === currentUserId && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDeleteNote(note.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}