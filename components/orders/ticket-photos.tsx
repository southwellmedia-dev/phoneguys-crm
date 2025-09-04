'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Upload,
  Camera,
  Trash2,
  Eye,
  Download,
  Share2,
  Image as ImageIcon,
  Loader2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { TicketPhoto } from '@/lib/services/ticket-photo.service';

interface TicketPhotosProps {
  ticketId: string;
  ticketNumber: string;
  userId: string;
}

export function TicketPhotos({ ticketId, ticketNumber, userId }: TicketPhotosProps) {
  const [photos, setPhotos] = useState<TicketPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<TicketPhoto | null>(null);
  const [description, setDescription] = useState('');
  const [photoType, setPhotoType] = useState<'general' | 'before' | 'after'>('general');

  // Load existing photos
  useEffect(() => {
    loadPhotos();
  }, [ticketId]);

  const loadPhotos = async () => {
    try {
      const response = await fetch(`/api/orders/${ticketId}/photos`);
      if (response.ok) {
        const data = await response.json();
        setPhotos(data.data || []);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
      toast.error('Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      toast.error('Some files were not images and were skipped');
    }
    
    setSelectedFiles(imageFiles);
    if (imageFiles.length > 0) {
      setUploadDialog(true);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setUploading(true);
    
    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('description', description);
        formData.append('type', photoType);
        
        const response = await fetch(`/api/orders/${ticketId}/photos`, {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
        
        const result = await response.json();
        setPhotos(prev => [result.data, ...prev]);
      }
      
      toast.success(`Uploaded ${selectedFiles.length} photo(s)`);
      setUploadDialog(false);
      setSelectedFiles([]);
      setDescription('');
      setPhotoType('general');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;
    
    try {
      const response = await fetch(`/api/orders/${ticketId}/photos/${photoId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete photo');
      }
      
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      toast.success('Photo deleted');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete photo');
    }
  };

  const handleShare = async () => {
    try {
      const response = await fetch(`/api/orders/${ticketId}/photos/share`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate share link');
      }
      
      const { data } = await response.json();
      await navigator.clipboard.writeText(data.url);
      toast.success('Share link copied to clipboard');
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to generate share link');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const beforePhotos = photos.filter(p => p.is_before_photo);
  const afterPhotos = photos.filter(p => p.is_after_photo);
  const generalPhotos = photos.filter(p => !p.is_before_photo && !p.is_after_photo);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Photos & Documentation
            </CardTitle>
            <div className="flex gap-2">
              {photos.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              )}
              <label htmlFor="photo-upload">
                <Button size="sm" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photos
                  </span>
                </Button>
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <div className="text-center py-8">
              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No photos uploaded yet</p>
              <p className="text-sm text-muted-foreground">
                Upload before/after photos to document the repair process
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Before Photos */}
              {beforePhotos.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Badge variant="secondary">Before</Badge>
                    {beforePhotos.length} photo(s)
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {beforePhotos.map(photo => (
                      <PhotoCard
                        key={photo.id}
                        photo={photo}
                        onView={() => setPreviewPhoto(photo)}
                        onDelete={() => handleDelete(photo.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* After Photos */}
              {afterPhotos.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Badge variant="secondary">After</Badge>
                    {afterPhotos.length} photo(s)
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {afterPhotos.map(photo => (
                      <PhotoCard
                        key={photo.id}
                        photo={photo}
                        onView={() => setPreviewPhoto(photo)}
                        onDelete={() => handleDelete(photo.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* General Photos */}
              {generalPhotos.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    General Documentation
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {generalPhotos.map(photo => (
                      <PhotoCard
                        key={photo.id}
                        photo={photo}
                        onView={() => setPreviewPhoto(photo)}
                        onDelete={() => handleDelete(photo.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Photos</DialogTitle>
            <DialogDescription>
              Add photos to document the repair process
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Selected Files</p>
              <div className="space-y-2 max-h-32 overflow-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="truncate">{file.name}</span>
                    <Badge variant="secondary">{formatFileSize(file.size)}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Photo Type</label>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant={photoType === 'before' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPhotoType('before')}
                >
                  Before
                </Button>
                <Button
                  type="button"
                  variant={photoType === 'after' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPhotoType('after')}
                >
                  After
                </Button>
                <Button
                  type="button"
                  variant={photoType === 'general' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPhotoType('general')}
                >
                  General
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Description (Optional)</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add notes about these photos..."
                className="mt-2"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setUploadDialog(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploading || selectedFiles.length === 0}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload {selectedFiles.length} Photo(s)
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewPhoto} onOpenChange={() => setPreviewPhoto(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {previewPhoto?.is_before_photo && <Badge className="mr-2">Before</Badge>}
              {previewPhoto?.is_after_photo && <Badge className="mr-2">After</Badge>}
              Photo Preview
            </DialogTitle>
            {previewPhoto?.description && (
              <DialogDescription>{previewPhoto.description}</DialogDescription>
            )}
          </DialogHeader>
          
          {previewPhoto && (
            <div className="relative">
              <img
                src={previewPhoto.url}
                alt="Ticket photo"
                className="w-full h-auto rounded-lg"
              />
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Uploaded {previewPhoto && new Date(previewPhoto.uploaded_at).toLocaleString()}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => window.open(previewPhoto?.url, '_blank')}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PhotoCard({ 
  photo, 
  onView, 
  onDelete 
}: { 
  photo: TicketPhoto; 
  onView: () => void; 
  onDelete: () => void;
}) {
  return (
    <div className="group relative aspect-square rounded-lg overflow-hidden border bg-muted">
      <img
        src={photo.url}
        alt={photo.description || 'Ticket photo'}
        className="object-cover w-full h-full cursor-pointer"
        onClick={onView}
        loading="lazy"
      />
      
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <Button
          size="icon"
          variant="ghost"
          className="text-white hover:bg-white/20"
          onClick={onView}
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="text-white hover:bg-white/20"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      
      {photo.description && (
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 text-white text-xs truncate">
          {photo.description}
        </div>
      )}
    </div>
  );
}