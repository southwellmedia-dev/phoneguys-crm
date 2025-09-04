"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Loader2, Image as ImageIcon, Search, Check, Plus } from "lucide-react";

interface MediaFile {
  id: string;
  name: string;
  url: string;
  size: number;
  created_at: string;
}

interface DeviceImageSelectorProps {
  selectedImageUrl?: string;
  onImageSelect: (imageUrl: string | null) => void;
  fetchMediaGallery: (searchTerm?: string, limit?: number) => Promise<any>;
  uploadToGallery?: (file: File) => Promise<{ success: boolean; data?: { url: string }; error?: string }>;
  trigger?: React.ReactNode;
  disabled?: boolean;
}

export function DeviceImageSelector({ 
  selectedImageUrl, 
  onImageSelect,
  fetchMediaGallery,
  uploadToGallery,
  trigger,
  disabled = false
}: DeviceImageSelectorProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(selectedImageUrl || null);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<string | null>(selectedImageUrl || null);
  
  // Gallery state
  const [galleryImages, setGalleryImages] = useState<MediaFile[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"gallery" | "upload" | "url">("gallery");

  // Fetch gallery images
  const fetchGalleryImages = useCallback(async () => {
    setGalleryLoading(true);
    try {
      const result = await fetchMediaGallery(searchTerm, 50);

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch gallery images');
      }

      setGalleryImages(result.data || []);
    } catch (error) {
      console.error('Error fetching gallery:', error);
      toast.error('Failed to load gallery images');
    } finally {
      setGalleryLoading(false);
    }
  }, [searchTerm, fetchMediaGallery]);

  // Fetch gallery on open and search term change
  useEffect(() => {
    if (open) {
      fetchGalleryImages();
    }
  }, [open, fetchGalleryImages]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setSelectedGalleryImage(null); // Clear gallery selection
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleGallerySelect = (imageUrl: string) => {
    setSelectedGalleryImage(imageUrl);
    setSelectedFile(null); // Clear file upload
    setPreviewUrl(imageUrl);
  };

  const handleSelect = async () => {
    if (selectedFile && uploadToGallery) {
      // Upload new file first, then use its URL
      setLoading(true);
      try {
        const result = await uploadToGallery(selectedFile);
        if (!result.success) {
          throw new Error(result.error || 'Failed to upload image');
        }
        onImageSelect(result.data?.url || null);
        toast.success('Image uploaded and selected');
        setOpen(false);
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to upload image');
      } finally {
        setLoading(false);
      }
    } else if (selectedGalleryImage) {
      // Use selected gallery image
      onImageSelect(selectedGalleryImage);
      setOpen(false);
    } else {
      toast.error('Please select an image or upload a new one');
    }
  };

  const resetDialog = () => {
    setSelectedFile(null);
    setSelectedGalleryImage(selectedImageUrl || null);
    setPreviewUrl(selectedImageUrl || null);
    setSearchTerm("");
    setActiveTab("gallery");
  };

  return (
    <div className="space-y-2">
      {/* Current Selection Preview */}
      {selectedImageUrl && (
        <div className="aspect-video max-w-48 bg-muted rounded-lg overflow-hidden border">
          <img 
            src={selectedImageUrl} 
            alt="Selected device image"
            className="object-cover w-full h-full"
          />
        </div>
      )}

      <div className="flex gap-2">
        <Dialog open={open} onOpenChange={(newOpen) => {
          setOpen(newOpen);
          if (!newOpen) resetDialog();
        }}>
          <DialogTrigger asChild>
            {trigger || (
              <Button variant="outline" size="sm" disabled={disabled}>
                <ImageIcon className="h-4 w-4 mr-2" />
                {selectedImageUrl ? 'Change Image' : 'Select Image'}
              </Button>
            )}
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Select Device Image</DialogTitle>
              <DialogDescription>
                Choose from gallery, upload a new image, or enter an image URL
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Preview */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden border">
                    {previewUrl ? (
                      <img 
                        src={previewUrl} 
                        alt="Preview"
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleSelect}
                    disabled={loading || (!selectedFile && !selectedGalleryImage)}
                    className="flex-1"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Select Image
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      onImageSelect(null);
                      setOpen(false);
                    }}
                    disabled={loading}
                  >
                    Remove
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>

              {/* Right: Selection */}
              <div>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "gallery" | "upload" | "url")}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="gallery">Gallery</TabsTrigger>
                    <TabsTrigger value="upload">Upload</TabsTrigger>
                    <TabsTrigger value="url">URL</TabsTrigger>
                  </TabsList>

                  <TabsContent value="gallery" className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search images..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>

                    {/* Gallery Grid */}
                    <ScrollArea className="h-96">
                      {galleryLoading ? (
                        <div className="flex items-center justify-center h-32">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : galleryImages.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {galleryImages.map((image) => (
                            <button
                              key={image.id}
                              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                                selectedGalleryImage === image.url 
                                  ? 'border-primary ring-2 ring-primary/20' 
                                  : 'border-muted hover:border-border'
                              }`}
                              onClick={() => handleGallerySelect(image.url)}
                            >
                              <img
                                src={image.url}
                                alt={image.name}
                                className="object-cover w-full h-full"
                              />
                              {selectedGalleryImage === image.url && (
                                <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-1">
                                  <Check className="h-3 w-3" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground py-8">
                          {searchTerm ? 'No images found matching your search' : 'No images in gallery'}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="upload" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="image-upload">Select Image File</Label>
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        disabled={loading}
                      />
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, JPEG, WEBP up to 5MB
                      </p>
                    </div>

                    {selectedFile && (
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-sm font-medium">{selectedFile.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)}MB • {selectedFile.type}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="url" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="image-url">Image URL</Label>
                      <Input
                        id="image-url"
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        value={selectedGalleryImage || ""}
                        onChange={(e) => {
                          const url = e.target.value;
                          setSelectedGalleryImage(url);
                          setSelectedFile(null);
                          setPreviewUrl(url);
                        }}
                        disabled={loading}
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter a direct URL to an image
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {selectedImageUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onImageSelect(null)}
            disabled={disabled}
          >
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}