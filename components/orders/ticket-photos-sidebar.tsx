'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Upload,
  Camera,
  Trash2,
  Eye,
  X,
  Plus,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { TicketPhoto } from '@/lib/services/ticket-photo.service';

interface TicketPhotosSidebarProps {
  ticketId: string;
  ticketNumber: string;
  userId: string;
  ticketServices?: any[];
}

// Pre-defined tags
const PREDEFINED_TAGS = [
  'before',
  'after',
  'damage',
  'repair-in-progress',
  'completed',
  'warranty-void',
  'water-damage',
  'screen-damage',
  'battery',
  'motherboard',
  'receipt',
  'customer-provided',
];

export function TicketPhotosSidebar({ 
  ticketId, 
  ticketNumber, 
  userId,
  ticketServices = []
}: TicketPhotosSidebarProps) {
  const [photos, setPhotos] = useState<TicketPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<TicketPhoto | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  // Upload form state
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('none');

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

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      setSelectedTags([...selectedTags, customTag.trim()]);
      setCustomTag('');
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
        formData.append('tags', JSON.stringify(selectedTags));
        if (selectedServiceId && selectedServiceId !== 'none') {
          formData.append('serviceId', selectedServiceId);
        }
        
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
      setSelectedTags([]);
      setCustomTag('');
      setSelectedServiceId('none');
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

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
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 dark:from-pink-500/5 dark:via-purple-500/5 dark:to-indigo-500/5 border-b border-pink-200/20 dark:border-purple-800/30">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 dark:from-pink-500/10 dark:to-purple-500/10">
                <Camera className="h-4 w-4 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <span className="text-sm font-semibold bg-gradient-to-r from-pink-600 to-purple-600 dark:from-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Photos
                </span>
                {photos.length > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {photos.length} {photos.length === 1 ? 'photo' : 'photos'} uploaded
                  </p>
                )}
              </div>
            </span>
            <label htmlFor="photo-upload-sidebar">
              <Button size="sm" variant="outline" className="hover:bg-pink-50 dark:hover:bg-pink-950/30 border-pink-200 dark:border-pink-800" asChild>
                <span className="flex items-center gap-1.5">
                  <Upload className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline text-xs">Upload</span>
                </span>
              </Button>
            </label>
            <input
              id="photo-upload-sidebar"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {photos.length === 0 ? (
            <div className="text-center py-8">
              <div className="p-4 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-pink-500 dark:text-pink-400" />
              </div>
              <h3 className="font-medium text-sm mb-1">No photos yet</h3>
              <p className="text-xs text-muted-foreground">Document the repair process</p>
            </div>
          ) : (
            <div className="space-y-3">
              {photos.slice(0, 4).map(photo => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.url}
                    alt={photo.description || 'Ticket photo'}
                    className="w-full h-20 object-cover rounded-lg cursor-pointer border border-border/50 transition-all group-hover:border-pink-200 dark:group-hover:border-pink-800/50"
                    onClick={() => setPreviewPhoto(photo)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-lg flex items-center justify-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-white hover:bg-white/20 h-7 w-7 backdrop-blur-sm"
                      onClick={() => setPreviewPhoto(photo)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-white hover:bg-white/20 h-7 w-7 backdrop-blur-sm"
                      onClick={() => handleDelete(photo.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {photo.tags && photo.tags.length > 0 && (
                    <div className="absolute bottom-1 left-1 right-1 flex flex-wrap gap-1">
                      {photo.tags.slice(0, 2).map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs px-1 py-0">
                          {tag}
                        </Badge>
                      ))}
                      {photo.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs px-1 py-0">
                          +{photo.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {photos.length > 4 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-3 text-pink-600 hover:text-pink-700 hover:bg-pink-50 dark:text-pink-400 dark:hover:text-pink-300 dark:hover:bg-pink-950/30 border border-dashed border-pink-200 dark:border-pink-800/50"
                  onClick={() => setPreviewPhoto(photos[0])}
                >
                  <Plus className="h-3 w-3 mr-1.5" />
                  View all {photos.length} photos
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Photos</DialogTitle>
            <DialogDescription>
              Add photos to document the repair process
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <p className="text-sm font-medium mb-2">Selected Files</p>
              <div className="space-y-2 max-h-24 overflow-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="truncate">{file.name}</span>
                    <Badge variant="secondary">{formatFileSize(file.size)}</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {PREDEFINED_TAGS.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add custom tag..."
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                  className="flex-1"
                />
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={addCustomTag}
                  disabled={!customTag.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedTags.map(tag => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                      <button
                        onClick={() => toggleTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Service Selection */}
            {ticketServices.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Associate with Service (Optional)
                </label>
                <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {ticketServices.map((ts: any) => (
                      <SelectItem key={ts.service?.id || ts.id} value={ts.service?.id || ts.id}>
                        {ts.service?.name || 'Unknown Service'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Description (Optional)
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add notes about these photos..."
                rows={3}
              />
            </div>
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
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewPhoto} onOpenChange={() => setPreviewPhoto(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Photo Preview
              {previewPhoto?.tags && previewPhoto.tags.map(tag => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </DialogTitle>
            {previewPhoto?.description && (
              <DialogDescription>{previewPhoto.description}</DialogDescription>
            )}
          </DialogHeader>
          
          {previewPhoto && (
            <>
              <div className="relative">
                <img
                  src={previewPhoto.url}
                  alt="Ticket photo"
                  className="w-full h-auto rounded-lg"
                />
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Uploaded {new Date(previewPhoto.uploaded_at).toLocaleString()}
                </p>
                <Button
                  variant="outline"
                  onClick={() => window.open(previewPhoto.url, '_blank')}
                >
                  Open Full Size
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}