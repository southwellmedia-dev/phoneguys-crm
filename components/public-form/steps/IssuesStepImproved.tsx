"use client";

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Power,
  ChevronDown,
  Check,
  DollarSign,
  Clock
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
  screen_repair: 'Screen & Display',
  battery_replacement: 'Battery',
  charging_port: 'Charging Issues',
  water_damage: 'Water Damage',
  camera_repair: 'Camera',
  speaker_repair: 'Sound & Speaker',
  motherboard_repair: 'Motherboard',
  data_recovery: 'Data Recovery',
  button_repair: 'Buttons & Controls',
  software_issue: 'Software',
  diagnostic: 'Diagnostic',
  other: 'Other Issues'
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  screen_repair: 'Cracked screens, touch issues, display problems',
  battery_replacement: 'Poor battery life, not holding charge',
  charging_port: 'Device won\'t charge, loose charging port',
  water_damage: 'Liquid damage, moisture issues',
  camera_repair: 'Camera not working, blurry photos',
  speaker_repair: 'No sound, distorted audio, mic issues',
  motherboard_repair: 'Device won\'t turn on, system failures',
  data_recovery: 'Recover lost photos, contacts, and data',
  button_repair: 'Power, volume, or home buttons not working',
  software_issue: 'OS problems, app crashes, slow performance',
  diagnostic: 'Not sure what\'s wrong? We\'ll diagnose it',
  other: 'Issues not listed above'
};

export function IssuesStepImproved({ services, selectedIssues, issueDescription, onUpdate }: IssuesStepProps) {
  const [description, setDescription] = useState(issueDescription || '');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Group services by category
  const servicesByCategory = services.reduce((acc: any, service) => {
    const category = service.category || 'other';
    if (!acc[category]) {
      acc[category] = {
        name: CATEGORY_NAMES[category] || category,
        description: CATEGORY_DESCRIPTIONS[category],
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

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getCategorySelectedCount = (category: string) => {
    const categoryServices = servicesByCategory[category]?.services || [];
    return categoryServices.filter((s: Service) => selectedIssues.includes(s.id)).length;
  };

  const getEstimatedCost = () => {
    const selected = services.filter(s => selectedIssues.includes(s.id));
    const hasQuoteRequired = selected.some(s => s.requiresQuote);
    
    if (hasQuoteRequired) {
      return 'Quote Required';
    }
    
    const total = selected.reduce((sum, s) => sum + (s.price || 0), 0);
    if (total === 0) return 'Free Diagnostic';
    
    return `$${total.toFixed(2)}`;
  };

  const getEstimatedDuration = () => {
    const selected = services.filter(s => selectedIssues.includes(s.id));
    const totalMinutes = selected.reduce((sum, s) => sum + (s.estimatedDuration || 30), 0);
    
    if (totalMinutes < 60) {
      return `${totalMinutes} min`;
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (minutes === 0) {
      return `${hours}hr`;
    }
    
    return `${hours}hr ${minutes}min`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-1">What needs fixing?</h2>
        <p className="text-sm text-gray-600">Select all issues with your device</p>
      </div>

      {/* Selected Summary - Always Visible */}
      {selectedIssues.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                {selectedIssues.length} issue{selectedIssues.length > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1 text-blue-700">
                <Clock className="h-3.5 w-3.5" />
                <span className="font-medium">{getEstimatedDuration()}</span>
              </div>
              <div className="flex items-center gap-1 text-blue-700">
                <DollarSign className="h-3.5 w-3.5" />
                <span className="font-medium">{getEstimatedCost()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="space-y-2">
        {Object.entries(servicesByCategory).map(([category, categoryData]: [string, any]) => {
          const isExpanded = expandedCategories.has(category);
          const selectedCount = getCategorySelectedCount(category);
          
          return (
            <div key={category} className="border rounded-lg overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    selectedCount > 0 ? "bg-blue-100" : "bg-gray-100"
                  )}>
                    <categoryData.icon className={cn(
                      "h-5 w-5",
                      selectedCount > 0 ? "text-blue-600" : "text-gray-600"
                    )} />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{categoryData.name}</p>
                      {selectedCount > 0 && (
                        <Badge variant="default" className="h-5 px-1.5 text-xs">
                          {selectedCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{categoryData.description}</p>
                  </div>
                </div>
                <ChevronDown className={cn(
                  "h-5 w-5 text-gray-400 transition-transform",
                  isExpanded && "rotate-180"
                )} />
              </button>

              {/* Services List */}
              {isExpanded && (
                <div className="border-t bg-gray-50 divide-y divide-gray-200">
                  {categoryData.services.map((service: Service) => {
                    const isSelected = selectedIssues.includes(service.id);
                    
                    return (
                      <label
                        key={service.id}
                        className={cn(
                          "flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-white transition-colors",
                          isSelected && "bg-blue-50 hover:bg-blue-50"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleIssueToggle(service.id)}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <p className={cn(
                            "font-medium text-sm",
                            isSelected ? "text-blue-900" : "text-gray-900"
                          )}>
                            {service.name}
                          </p>
                          {service.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{service.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1.5">
                            {service.price && !service.requiresQuote && (
                              <span className="text-xs font-medium text-gray-700">
                                ${service.price.toFixed(2)}
                              </span>
                            )}
                            {service.requiresQuote && (
                              <span className="text-xs text-gray-500">
                                Quote required
                              </span>
                            )}
                            {service.estimatedDuration && (
                              <span className="text-xs text-gray-500">
                                • {service.estimatedDuration} min
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Additional Description */}
      <div className="space-y-2 pt-4">
        <Label htmlFor="description" className="text-sm font-medium">
          Additional details (optional)
        </Label>
        <Textarea
          id="description"
          placeholder="Tell us more about the issues you're experiencing..."
          value={description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          rows={3}
          className="resize-none text-sm"
        />
      </div>

      {/* No Selection Warning */}
      {selectedIssues.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <AlertTriangle className="h-10 w-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Please select at least one issue to continue</p>
        </div>
      )}
    </div>
  );
}