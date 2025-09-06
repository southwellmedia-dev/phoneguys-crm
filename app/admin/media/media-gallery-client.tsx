'use client';

import { useState, useCallback } from 'react';
import { useMediaGallery, useUploadMedia, useDeleteMedia } from '@/lib/hooks/use-admin';
import { useRealtime } from '@/lib/hooks/use-realtime';
import { useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Trash2, 
  Download, 
  Copy, 
  Search, 
  Grid3x3, 
  List,
  Image as ImageIcon,
  Check,
  X,
  Loader2,
  Eye
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SkeletonMediaGallery } from '@/components/ui/skeleton-media-gallery';

interface StorageImage {
  name: string;
  url: string;
  size?: number;
  created_at?: string;
  updated_at?: string;
  last_accessed_at?: string;
}

interface MediaGalleryProps {
  initialImages: StorageImage[];
  onSelectImage?: (url: string) => void;
  selectionMode?: boolean;
}

export function MediaGallery({ 
  initialImages, 
  onSelectImage, 
  selectionMode = false 
}: MediaGalleryProps) {
  const queryClient = useQueryClient();
  const { data: images = initialImages, isLoading, refetch } = useMediaGallery(initialImages);
  const uploadMedia = useUploadMedia();
  const deleteMedia = useDeleteMedia();
  
  // Set up real-time subscriptions
  useRealtime(['admin']);
  
  // Ensure images is always an array
  const safeImages = Array.isArray(images) ? images : [];
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<StorageImage | null>(null);

  const filteredImages = safeImages.filter(img => 
    img.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type === 'image/svg+xml'
    );
    
    if (imageFiles.length !== files.length) {
      toast.error('Some files were not images and were skipped');
    }
    
    setUploadingFiles(prev => [...prev, ...imageFiles]);
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name.replace(/\.[^/.]+$/, '')); // Remove extension

    uploadMedia.mutate(formData, {
      onSuccess: () => {
        setIsUploading(false);
        setUploadingFiles(prev => prev.filter(f => f.name !== file.name));
      },
      onError: () => {
        setIsUploading(false);
      },
    });
  };

  const handleDelete = async (imageName: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;
    
    deleteMedia.mutate(imageName, {
      onSuccess: () => {
        setSelectedImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(imageName);
          return newSet;
        });
      },
    });
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  };

  const toggleImageSelection = (imageName: string) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageName)) {
        newSet.delete(imageName);
      } else {
        newSet.add(imageName);
      }
      return newSet;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedImages.size === 0) return;
    
    if (!confirm(`Delete ${selectedImages.size} selected images?`)) return;

    for (const imageName of selectedImages) {
      await handleDelete(imageName);
    }
    
    setSelectedImages(new Set());
  };

  const headerActions = [
    {
      label: 'Refresh',
      icon: <Upload className="h-4 w-4" />,
      variant: 'outline' as const,
      onClick: () => refetch(),
    },
    ...(selectedImages.size > 0 ? [
      {
        label: `Delete ${selectedImages.size} selected`,
        icon: <Trash2 className="h-4 w-4" />,
        variant: 'destructive' as const,
        onClick: handleBulkDelete,
      }
    ] : []),
    {
      label: viewMode === 'grid' ? 'List View' : 'Grid View',
      icon: viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3x3 className="h-4 w-4" />,
      variant: 'outline' as const,
      onClick: () => setViewMode(prev => prev === 'grid' ? 'list' : 'grid'),
    }
  ];

  if (isLoading) {
    return (
      <PageContainer
        title="Media Gallery"
        description="Manage device images and media files"
        actions={headerActions}
      >
        <SkeletonMediaGallery viewMode={viewMode} />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Media Gallery"
      description="Manage device images and media files"
      actions={headerActions}
    >
      <div className="space-y-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept="image/*,.svg,image/svg+xml"
                  multiple
                  onChange={handleFileSelect}
                  className="flex-1"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button asChild>
                    <span>
                      <Upload className="mr-2 h-4 w-4" />
                      Select Images
                    </span>
                  </Button>
                </label>
              </div>

              {/* Upload Queue */}
              {uploadingFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {uploadingFiles.length} file(s) ready to upload
                  </p>
                  <div className="space-y-2">
                    {uploadingFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" />
                          <span className="text-sm">{file.name}</span>
                          <Badge variant="secondary">{formatFileSize(file.size)}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpload(file)}
                            disabled={isUploading}
                          >
                            {isUploading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setUploadingFiles(prev => prev.filter((_, i) => i !== index))}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Search Bar */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {filteredImages.length} images found
          </p>
        </div>

        {/* Gallery */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredImages.map((image) => (
              <Card 
                key={image.name}
                className={cn(
                  "group relative overflow-hidden cursor-pointer transition-all",
                  selectedImages.has(image.name) && "ring-2 ring-primary"
                )}
                onClick={() => selectionMode ? onSelectImage?.(image.url) : setPreviewImage(image)}
              >
                <div className="aspect-square relative">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="object-cover w-full h-full"
                    loading="lazy"
                  />
                  
                  {/* Selection Checkbox */}
                  <div
                    className="absolute top-2 left-2 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleImageSelection(image.name);
                    }}
                  >
                    <div className={cn(
                      "h-6 w-6 rounded border-2 border-white bg-black/50 flex items-center justify-center",
                      selectedImages.has(image.name) && "bg-primary"
                    )}>
                      {selectedImages.has(image.name) && (
                        <Check className="h-4 w-4 text-white" />
                      )}
                    </div>
                  </div>

                  {/* Actions Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-white hover:bg-white/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewImage(image);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-white hover:bg-white/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyUrl(image.url);
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-white hover:bg-white/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(image.name);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-2">
                  <p className="text-xs truncate">{image.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(image.size)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredImages.map((image) => (
                  <div
                    key={image.name}
                    className={cn(
                      "flex items-center gap-4 p-4 hover:bg-muted/50",
                      selectedImages.has(image.name) && "bg-primary/5"
                    )}
                  >
                    <div
                      className="flex items-center justify-center"
                      onClick={() => toggleImageSelection(image.name)}
                    >
                      <div className={cn(
                        "h-5 w-5 rounded border-2 flex items-center justify-center",
                        selectedImages.has(image.name) && "bg-primary border-primary"
                      )}>
                        {selectedImages.has(image.name) && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                    </div>
                    
                    <img
                      src={image.url}
                      alt={image.name}
                      className="h-12 w-12 object-cover rounded"
                      loading="lazy"
                    />
                    
                    <div className="flex-1">
                      <p className="font-medium text-sm">{image.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(image.size)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPreviewImage(image)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyUrl(image.url)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(image.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewImage?.name}</DialogTitle>
            <DialogDescription>
              {formatFileSize(previewImage?.size)}
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <img
              src={previewImage?.url}
              alt={previewImage?.name}
              className="w-full h-auto"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => handleCopyUrl(previewImage?.url || '')}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy URL
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(previewImage?.url, '_blank')}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}