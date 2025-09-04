"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateDevice, useUpdateDevice } from "@/lib/hooks/use-admin";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2, Edit, Smartphone } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Device } from "@/lib/types/database.types";
import { DeviceImageSelector } from "./device-image-selector";

const deviceSchema = z.object({
  manufacturer_id: z.string().min(1, 'Please select a manufacturer'),
  model_name: z.string().min(1, 'Model name is required').max(200, 'Model name too long'),
  model_number: z.string().max(100, 'Model number too long').optional(),
  device_type: z.enum(['smartphone', 'tablet', 'laptop', 'smartwatch', 'desktop', 'earbuds', 'other']).optional(),
  release_year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  image_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  specifications: z.record(z.string()).optional(),
});

type DeviceInput = z.infer<typeof deviceSchema>;

interface DeviceDialogProps {
  device?: Device;
  manufacturers: Array<{ id: string; name: string; }>;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
  fetchMediaGallery?: (searchTerm?: string, limit?: number) => Promise<any>;
  uploadToGallery?: (file: File) => Promise<{ success: boolean; data?: { url: string }; error?: string }>;
}

export function DeviceDialog({ 
  device, 
  manufacturers, 
  onSuccess, 
  trigger,
  fetchMediaGallery,
  uploadToGallery
}: DeviceDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const isEdit = !!device;

  const form = useForm<DeviceInput>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      manufacturer_id: device?.manufacturer_id || "",
      model_name: device?.model_name || "",
      model_number: device?.model_number || "",
      device_type: device?.device_type || "smartphone",
      release_year: device?.release_year || new Date().getFullYear(),
      image_url: device?.image_url || "",
      specifications: device?.specifications || {},
    },
  });

  async function onSubmit(values: DeviceInput) {
    setIsLoading(true);

    try {
      const url = isEdit ? `/api/admin/devices/${device.id}` : '/api/admin/devices';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${isEdit ? 'update' : 'create'} device`);
      }

      toast.success(`Device ${isEdit ? 'updated' : 'created'} successfully`);

      form.reset();
      setOpen(false);
      
      // Call onSuccess callback or refresh the page
      if (onSuccess) {
        onSuccess();
      } else {
        // Query invalidation handled by useCreateDevice/useUpdateDevice mutations
      }

    } catch (error) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} device:`, error);
      toast.error(error instanceof Error ? error.message : `Failed to ${isEdit ? 'update' : 'create'} device`);
    } finally {
      setIsLoading(false);
    }
  }

  const defaultTrigger = (
    <Button size="sm" className="inline-flex items-center gap-1">
      {isEdit ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      {isEdit ? 'Edit' : 'Add Device'}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Device' : 'Add New Device'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the device information below.' : 'Add a new device to the database.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="manufacturer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manufacturer</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select manufacturer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {manufacturers.map((manufacturer) => (
                        <SelectItem key={manufacturer.id} value={manufacturer.id}>
                          {manufacturer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="model_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="iPhone 15 Pro" 
                      {...field} 
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="model_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model Number</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="A3108" 
                        {...field} 
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="release_year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Release Year</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="2024"
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="device_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Device Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select device type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="smartphone">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          <span>Smartphone</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="tablet">Tablet</SelectItem>
                      <SelectItem value="laptop">Laptop</SelectItem>
                      <SelectItem value="smartwatch">Smartwatch</SelectItem>
                      <SelectItem value="desktop">Desktop</SelectItem>
                      <SelectItem value="earbuds">Earbuds</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Device Image</FormLabel>
                  <FormControl>
                    {fetchMediaGallery ? (
                      <DeviceImageSelector
                        selectedImageUrl={field.value}
                        onImageSelect={(url) => field.onChange(url || "")}
                        fetchMediaGallery={fetchMediaGallery}
                        uploadToGallery={uploadToGallery}
                        disabled={isLoading}
                      />
                    ) : (
                      <Input 
                        type="url"
                        placeholder="https://example.com/device-image.jpg" 
                        {...field} 
                        disabled={isLoading}
                      />
                    )}
                  </FormControl>
                  <FormDescription>
                    {fetchMediaGallery ? 'Select from gallery, upload new image, or enter URL' : 'Optional URL to a product image'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEdit ? 'Update Device' : 'Add Device'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}