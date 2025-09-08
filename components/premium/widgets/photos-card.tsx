"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Camera, 
  Plus, 
  Download, 
  Trash2, 
  Eye, 
  Upload,
  Image as ImageIcon,
  Grid3x3,
  List
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Photo {
  id: string;
  url: string;
  filename: string;
  size: number;
  type: string;
  uploaded_at: string;
  uploaded_by: {
    name: string;
    id: string;
  };
  description?: string;
  category?: "before" | "after" | "progress" | "damage" | "parts" | "other";
}

export interface PhotosCardProps {
  photos: Photo[];
  variant?: "default" | "elevated" | "glass" | "compact";
  layout?: "grid" | "list";
  showUpload?: boolean;
  showCategories?: boolean;
  maxPhotos?: number;
  onPhotoClick?: (photo: Photo) => void;
  onPhotoDelete?: (photo: Photo) => void;
  onPhotoUpload?: (files: FileList) => void;
  className?: string;
}

export function PhotosCard({
  photos,
  variant = "default",
  layout = "grid",
  showUpload = true,
  showCategories = true,
  maxPhotos,
  onPhotoClick,
  onPhotoDelete,
  onPhotoUpload,
  className
}: PhotosCardProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewLayout, setViewLayout] = useState<"grid" | "list">(layout);

  const categories = [
    { id: "all", label: "All", count: photos.length },
    { id: "before", label: "Before", count: photos.filter(p => p.category === "before").length },
    { id: "after", label: "After", count: photos.filter(p => p.category === "after").length },
    { id: "progress", label: "Progress", count: photos.filter(p => p.category === "progress").length },
    { id: "damage", label: "Damage", count: photos.filter(p => p.category === "damage").length },
    { id: "parts", label: "Parts", count: photos.filter(p => p.category === "parts").length },
    { id: "other", label: "Other", count: photos.filter(p => p.category === "other" || !p.category).length },
  ].filter(cat => cat.count > 0);

  const filteredPhotos = selectedCategory === "all" 
    ? photos 
    : photos.filter(p => p.category === selectedCategory || (selectedCategory === "other" && !p.category));

  const displayPhotos = maxPhotos ? filteredPhotos.slice(0, maxPhotos) : filteredPhotos;

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case "before": return "blue";
      case "after": return "green";
      case "progress": return "amber";
      case "damage": return "red";
      case "parts": return "purple";
      default: return "gray";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (variant === "compact") {
    return (
      <Card variant="elevated" className={cn("p-4", className)}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
              <Camera className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{photos.length} Photos</h3>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(photos.reduce((sum, p) => sum + p.size, 0))}
              </p>
            </div>
          </div>
          {showUpload && (
            <Button size="sm" variant="outline">
              <Upload className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          {displayPhotos.slice(0, 4).map((photo) => (
            <div
              key={photo.id}
              className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onPhotoClick?.(photo)}
            >
              <img
                src={photo.url}
                alt={photo.filename}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
        
        {photos.length > 4 && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            +{photos.length - 4} more photos
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
              <Camera className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Photos</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {photos.length} file{photos.length !== 1 ? 's' : ''} • {formatFileSize(photos.reduce((sum, p) => sum + p.size, 0))}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex border rounded-lg overflow-hidden">
              <Button
                size="sm"
                variant={viewLayout === "grid" ? "default" : "ghost"}
                onClick={() => setViewLayout("grid")}
                className="rounded-none"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={viewLayout === "list" ? "default" : "ghost"}
                onClick={() => setViewLayout("list")}
                className="rounded-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            {showUpload && (
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Photos
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Categories */}
      {showCategories && categories.length > 1 && (
        <div className="px-6 pb-4 border-b">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                size="sm"
                variant={selectedCategory === category.id ? "solid" : "outline"}
                color={selectedCategory === category.id ? "cyan" : undefined}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.label}
                {category.count > 0 && (
                  <Badge variant="soft" size="sm" className="ml-1">
                    {category.count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>
      )}

      <CardContent>
        {displayPhotos.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-2">No photos yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload photos to document the repair process
            </p>
            {showUpload && (
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload First Photo
              </Button>
            )}
          </div>
        ) : (
          <>
            {viewLayout === "grid" ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {displayPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="group relative aspect-square overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 rounded-lg border"
                    onClick={() => onPhotoClick?.(photo)}
                  >
                    <img
                      src={photo.url}
                      alt={photo.filename}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200">
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                          <Download className="h-4 w-4" />
                        </Button>
                        {onPhotoDelete && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-white hover:bg-red-500/50"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPhotoDelete(photo);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Category Badge */}
                    {photo.category && (
                      <div className="absolute top-2 left-2">
                        <Badge 
                          variant="solid" 
                          color={getCategoryColor(photo.category)}
                          size="sm"
                        >
                          {photo.category}
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {displayPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => onPhotoClick?.(photo)}
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={photo.url}
                        alt={photo.filename}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{photo.filename}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(photo.size)} • {photo.uploaded_by.name}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {photo.category && (
                            <Badge 
                              variant="soft" 
                              color={getCategoryColor(photo.category)}
                              size="sm"
                            >
                              {photo.category}
                            </Badge>
                          )}
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost">
                              <Download className="h-4 w-4" />
                            </Button>
                            {onPhotoDelete && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPhotoDelete(photo);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {maxPhotos && photos.length > maxPhotos && (
              <div className="text-center mt-6 pt-6 border-t">
                <Button variant="outline">
                  View All {photos.length} Photos
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}