"use client";

import { useState, ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Service, ServiceCategory, SkillLevel } from "@/lib/types/database.types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit, 
  Wrench, 
  DollarSign, 
  Clock, 
  Zap,
  Shield,
  AlertTriangle,
  Star
} from "lucide-react";
import { toast } from "sonner";

// Validation schemas
const CreateServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required').max(200),
  description: z.string().max(1000).optional().or(z.literal('')),
  category: z.enum([
    'screen_repair', 'battery_replacement', 'charging_port', 'water_damage', 
    'diagnostic', 'software_issue', 'camera_repair', 'speaker_repair',
    'button_repair', 'motherboard_repair', 'data_recovery', 'other'
  ] as const).optional(),
  base_price: z.number().min(0, 'Price must be positive').optional(),
  estimated_duration_minutes: z.number().int().min(1, 'Duration must be at least 1 minute').optional(),
  requires_parts: z.boolean().default(false),
  skill_level: z.enum(['basic', 'intermediate', 'advanced', 'expert'] as const).optional(),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
});

const UpdateServiceSchema = CreateServiceSchema.partial();

type CreateServiceInput = z.infer<typeof CreateServiceSchema>;

interface ServiceDialogProps {
  service?: Service;
  onSuccess?: () => void;
  trigger?: ReactNode;
}

const SERVICE_CATEGORIES: { value: ServiceCategory; label: string; icon: ReactNode }[] = [
  { value: 'screen_repair', label: 'Screen Repair', icon: <Wrench className="h-4 w-4" /> },
  { value: 'battery_replacement', label: 'Battery Replacement', icon: <Zap className="h-4 w-4" /> },
  { value: 'charging_port', label: 'Charging Port', icon: <Zap className="h-4 w-4" /> },
  { value: 'water_damage', label: 'Water Damage', icon: <AlertTriangle className="h-4 w-4" /> },
  { value: 'diagnostic', label: 'Diagnostic', icon: <Shield className="h-4 w-4" /> },
  { value: 'software_issue', label: 'Software Issue', icon: <Shield className="h-4 w-4" /> },
  { value: 'camera_repair', label: 'Camera Repair', icon: <Wrench className="h-4 w-4" /> },
  { value: 'speaker_repair', label: 'Speaker Repair', icon: <Wrench className="h-4 w-4" /> },
  { value: 'button_repair', label: 'Button Repair', icon: <Wrench className="h-4 w-4" /> },
  { value: 'motherboard_repair', label: 'Motherboard Repair', icon: <Star className="h-4 w-4" /> },
  { value: 'data_recovery', label: 'Data Recovery', icon: <Shield className="h-4 w-4" /> },
  { value: 'other', label: 'Other', icon: <Wrench className="h-4 w-4" /> },
];

const SKILL_LEVELS: { value: SkillLevel; label: string; icon: ReactNode }[] = [
  { value: 'basic', label: 'Basic', icon: <div className="w-2 h-2 rounded-full bg-green-500" /> },
  { value: 'intermediate', label: 'Intermediate', icon: <div className="w-2 h-2 rounded-full bg-yellow-500" /> },
  { value: 'advanced', label: 'Advanced', icon: <div className="w-2 h-2 rounded-full bg-orange-500" /> },
  { value: 'expert', label: 'Expert', icon: <div className="w-2 h-2 rounded-full bg-red-500" /> },
];

export function ServiceDialog({ service, onSuccess, trigger }: ServiceDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!service;

  const form = useForm<CreateServiceInput>({
    resolver: zodResolver(isEditing ? UpdateServiceSchema : CreateServiceSchema),
    defaultValues: {
      name: service?.name || "",
      description: service?.description || "",
      category: service?.category || undefined,
      base_price: service?.base_price || undefined,
      estimated_duration_minutes: service?.estimated_duration_minutes || undefined,
      requires_parts: service?.requires_parts || false,
      skill_level: service?.skill_level || undefined,
      is_active: service?.is_active ?? true,
      sort_order: service?.sort_order || 0,
    },
  });

  const onSubmit = async (data: CreateServiceInput) => {
    setIsLoading(true);
    try {
      const url = isEditing ? `/api/admin/services/${service.id}` : '/api/admin/services';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${isEditing ? 'update' : 'create'} service`);
      }

      toast.success(`Service ${isEditing ? 'updated' : 'created'} successfully`);
      setOpen(false);
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error(error instanceof Error ? error.message : `Failed to ${isEditing ? 'update' : 'create'} service`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return isNaN(num) ? '' : num.toFixed(2);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const defaultTrigger = (
    <Button size="sm" className="gap-1">
      <Plus className="h-4 w-4" />
      Add Service
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Edit className="h-5 w-5" />
                Edit Service
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                Add New Service
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update the service information below."
              : "Create a new repair service with pricing and details."
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Service Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. iPhone Screen Repair" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SERVICE_CATEGORIES.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            <div className="flex items-center gap-2">
                              {category.icon}
                              {category.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Base Price */}
              <FormField
                control={form.control}
                name="base_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Price</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="number" 
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="pl-10"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          value={field.value?.toString() || ''}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Starting price before parts and labor adjustments
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Duration */}
              <FormField
                control={form.control}
                name="estimated_duration_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="number" 
                          min="1"
                          placeholder="60"
                          className="pl-10"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          value={field.value?.toString() || ''}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      {field.value ? `Estimated time: ${formatDuration(field.value)}` : 'Estimated completion time'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Skill Level */}
              <FormField
                control={form.control}
                name="skill_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skill Level</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select skill level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SKILL_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            <div className="flex items-center gap-2">
                              {level.icon}
                              {level.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Technical difficulty level required
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sort Order */}
              <FormField
                control={form.control}
                name="sort_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sort Order</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                        value={field.value?.toString() || '0'}
                      />
                    </FormControl>
                    <FormDescription>
                      Display order (lower numbers appear first)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Detailed description of the service, what's included, and any special requirements..."
                      className="min-h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Detailed information about the service for staff and customers
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Checkboxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="requires_parts"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Requires Parts</FormLabel>
                      <FormDescription>
                        Service typically needs replacement parts
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active Service</FormLabel>
                      <FormDescription>
                        Available for new repair tickets
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    {isEditing ? (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        Update Service
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Service
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}