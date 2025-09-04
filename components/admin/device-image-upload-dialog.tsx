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
import { Loader2, Upload, Image as ImageIcon, X, Search, Check } from "lucide-react";
import { Device } from "@/lib/types/database.types";

interface MediaFile {
  id: string;
  name: string;
  url: string;
  size: number;
  created_at: string;
}

interface DeviceImageUploadDialogProps {
  device: Device;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
  fetchMediaGallery: (searchTerm?: string, limit?: number) => Promise<any>;
  uploadDeviceImage: (formData: FormData) => Promise<any>;
  selectDeviceImage: (deviceId: string, imageUrl: string) => Promise<any>;
  removeDeviceImage: (deviceId: string) => Promise<any>;
}

export function DeviceImageUploadDialog({ 
  device, 
  onSuccess, 
  trigger,
  fetchMediaGallery,
  uploadDeviceImage,
  selectDeviceImage,
  removeDeviceImage
}: DeviceImageUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(device.image_url || null);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<string | null>(null);
  
  // Gallery state
  const [galleryImages, setGalleryImages] = useState<MediaFile[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"gallery" | "upload">("gallery");

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

  const handleSave = async () => {
    if (selectedFile) {
      // Upload new file
      await handleUpload();
    } else if (selectedGalleryImage) {
      // Use selected gallery image
      await handleSelectFromGallery();
    } else {
      toast.error('Please select an image or upload a new one');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('deviceId', device.id);
      formData.append('deviceName', device.model_name);

      const result = await uploadDeviceImage(formData);

      if (!result.success) {
        throw new Error(result.error || 'Failed to upload image');
      }

      toast.success('Device image updated successfully');
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFromGallery = async () => {
    if (!selectedGalleryImage) return;

    setLoading(true);

    try {
      const result = await selectDeviceImage(device.id, selectedGalleryImage);

      if (!result.success) {
        throw new Error(result.error || 'Failed to select image');
      }

      toast.success('Device image updated successfully');
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error selecting image:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to select image');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = async () => {
    setLoading(true);

    try {
      const result = await removeDeviceImage(device.id);

      if (!result.success) {
        throw new Error(result.error || 'Failed to remove image');
      }

      toast.success('Device image removed successfully');
      setPreviewUrl(null);
      setSelectedFile(null);
      setSelectedGalleryImage(null);
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove image');
    } finally {
      setLoading(false);
    }
  };

  const resetDialog = () => {
    setSelectedFile(null);
    setSelectedGalleryImage(null);
    setPreviewUrl(device.image_url || null);
    setSearchTerm("");
    setActiveTab("gallery");
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetDialog();
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <ImageIcon className="h-4 w-4 mr-2" />
            Update Image
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Update Device Image</DialogTitle>
          <DialogDescription>
            Select from gallery, search existing images, or upload a new image for {device.manufacturer?.name} {device.model_name}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Preview */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Current Image</Label>
              <div className="aspect-square bg-muted rounded-lg overflow-hidden border">
                {previewUrl ? (
                  <div className="relative w-full h-full">
                    <img 
                      src={previewUrl} 
                      alt={device.model_name}
                      className="object-cover w-full h-full"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveImage}
                      disabled={loading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
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
                onClick={handleSave}
                disabled={loading || (!selectedFile && !selectedGalleryImage)}
                className="flex-1"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Image
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
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "gallery" | "upload")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="gallery">Gallery</TabsTrigger>
                <TabsTrigger value="upload">Upload New</TabsTrigger>
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
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}