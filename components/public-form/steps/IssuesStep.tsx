"use client";

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Smartphone,
  Battery,
  Zap,
  Droplets,
  Camera,
  Volume2,
  Cpu,
  HardDrive,
  Wrench,
  AlertTriangle,
  Monitor,
  Power
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Service {
  id: string;
  name: string;
  description?: string;
  category?: string;
  price?: number;
  estimatedDuration?: number;
  requiresQuote?: boolean;
}

interface IssuesStepProps {
  services: Service[];
  selectedIssues: string[];
  issueDescription?: string;
  onUpdate: (issues: string[], description?: string) => void;
}

const CATEGORY_ICONS: Record<string, any> = {
  screen_repair: Monitor,
  battery_replacement: Battery,
  charging_port: Zap,
  water_damage: Droplets,
  camera_repair: Camera,
  speaker_repair: Volume2,
  motherboard_repair: Cpu,
  data_recovery: HardDrive,
  button_repair: Power,
  software_issue: Wrench,
  diagnostic: AlertTriangle,
  other: Smartphone
};

const CATEGORY_NAMES: Record<string, string> = {
  screen_repair: 'Screen Repair',
  battery_replacement: 'Battery Replacement',
  charging_port: 'Charging Port',
  water_damage: 'Water Damage',
  camera_repair: 'Camera Repair',
  speaker_repair: 'Speaker Repair',
  motherboard_repair: 'Motherboard Repair',
  data_recovery: 'Data Recovery',
  button_repair: 'Button Repair',
  software_issue: 'Software Issues',
  diagnostic: 'Diagnostic',
  other: 'Other Issues'
};

export function IssuesStep({ services, selectedIssues, issueDescription, onUpdate }: IssuesStepProps) {
  const [description, setDescription] = useState(issueDescription || '');

  // Group services by category
  const servicesByCategory = services.reduce((acc: any, service) => {
    const category = service.category || 'other';
    if (!acc[category]) {
      acc[category] = {
        name: CATEGORY_NAMES[category] || category,
        icon: CATEGORY_ICONS[category] || Smartphone,
        services: []
      };
    }
    acc[category].services.push(service);
    return acc;
  }, {});

  const handleIssueToggle = (serviceId: string) => {
    const newIssues = selectedIssues.includes(serviceId)
      ? selectedIssues.filter(id => id !== serviceId)
      : [...selectedIssues, serviceId];
    
    onUpdate(newIssues, description);
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    onUpdate(selectedIssues, value);
  };

  const getEstimatedCost = () => {
    const selected = services.filter(s => selectedIssues.includes(s.id));
    const hasQuoteRequired = selected.some(s => s.requiresQuote);
    
    if (hasQuoteRequired) {
      return 'Quote Required';
    }
    
    const total = selected.reduce((sum, s) => sum + (s.price || 0), 0);
    if (total === 0) return 'Free Diagnostic';
    
    return `Estimated: $${total.toFixed(2)}`;
  };

  const getEstimatedDuration = () => {
    const selected = services.filter(s => selectedIssues.includes(s.id));
    const totalMinutes = selected.reduce((sum, s) => sum + (s.estimatedDuration || 30), 0);
    
    if (totalMinutes < 60) {
      return `${totalMinutes} minutes`;
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (minutes === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    
    return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} min`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">What Issues Are You Having?</h2>
        <p className="text-gray-600">Select all that apply to your device</p>
      </div>

      {/* Common Issues Grid */}
      <div className="space-y-4">
        {Object.entries(servicesByCategory).map(([category, categoryData]: [string, any]) => (
          <div key={category} className="space-y-3">
            <div className="flex items-center gap-2">
              <categoryData.icon className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold">{categoryData.name}</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categoryData.services.map((service: Service) => (
                <Card
                  key={service.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    selectedIssues.includes(service.id) && "ring-2 ring-primary bg-primary/5"
                  )}
                  onClick={() => handleIssueToggle(service.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedIssues.includes(service.id)}
                        onCheckedChange={() => handleIssueToggle(service.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{service.name}</p>
                        {service.description && (
                          <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {service.price && !service.requiresQuote && (
                            <Badge variant="secondary" className="text-xs">
                              ${service.price.toFixed(2)}
                            </Badge>
                          )}
                          {service.requiresQuote && (
                            <Badge variant="outline" className="text-xs">
                              Quote Required
                            </Badge>
                          )}
                          {service.estimatedDuration && (
                            <Badge variant="outline" className="text-xs">
                              {service.estimatedDuration} min
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Additional Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Additional Details (Optional)</Label>
        <Textarea
          id="description"
          placeholder="Describe any additional issues or specific problems you're experiencing..."
          value={description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          rows={4}
        />
        <p className="text-sm text-gray-500">
          Providing more details helps us prepare for your appointment
        </p>
      </div>

      {/* Summary */}
      {selectedIssues.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-blue-900">
                  {selectedIssues.length} issue{selectedIssues.length > 1 ? 's' : ''} selected
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Estimated time: {getEstimatedDuration()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-blue-900">{getEstimatedCost()}</p>
                <p className="text-xs text-blue-700 mt-1">Plus tax</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedIssues.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Please select at least one issue to continue</p>
        </div>
      )}
    </div>
  );
}