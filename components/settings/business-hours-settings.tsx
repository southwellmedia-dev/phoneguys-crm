'use client';

import { useState } from 'react';
import { useUpdateAllBusinessHours } from '@/lib/hooks/use-settings';
import { ButtonPremium } from '@/components/premium/ui/buttons';
import { SwitchPremium } from '@/components/premium/ui/forms';
import { InputPremium } from '@/components/premium/ui/forms';
import { LoadingSpinner } from '@/components/premium/ui/feedback';
import type { BusinessHours } from '@/lib/types/database.types';
import { Save } from 'lucide-react';

interface BusinessHoursSettingsProps {
  initialData: BusinessHours[];
  onChangesDetected?: (hasChanges: boolean) => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export function BusinessHoursSettings({ initialData, onChangesDetected }: BusinessHoursSettingsProps) {
  const [hours, setHours] = useState<BusinessHours[]>(initialData);
  const updateMutation = useUpdateAllBusinessHours();

  const handleHoursChange = (dayOfWeek: number, field: keyof BusinessHours, value: any) => {
    setHours(prev => {
      const updated = prev.map(h => 
        h.day_of_week === dayOfWeek 
          ? { ...h, [field]: value }
          : h
      );
      
      // Notify parent of changes
      const hasChanges = JSON.stringify(updated) !== JSON.stringify(initialData);
      onChangesDetected?.(hasChanges);
      
      return updated;
    });
  };

  const handleSave = async () => {
    await updateMutation.mutateAsync(hours);
  };

  const ensureAllDaysExist = () => {
    const existingDays = hours.map(h => h.day_of_week);
    const missingDays = DAYS_OF_WEEK.filter(d => !existingDays.includes(d.value));
    
    if (missingDays.length > 0) {
      const newHours = [...hours];
      missingDays.forEach(day => {
        newHours.push({
          id: `temp-${day.value}`,
          day_of_week: day.value,
          open_time: '09:00:00',
          close_time: '18:00:00',
          is_active: day.value !== 0, // Sunday off by default
          break_start: null,
          break_end: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as BusinessHours);
      });
      setHours(newHours.sort((a, b) => a.day_of_week - b.day_of_week));
    }
  };

  // Ensure all days exist on mount
  useState(() => {
    ensureAllDaysExist();
  });

  return (
    <div className="space-y-6">
      {DAYS_OF_WEEK.map(day => {
        const dayHours = hours.find(h => h.day_of_week === day.value);
        if (!dayHours) return null;

        return (
          <div key={day.value} className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-lg">{day.label}</h3>
              <SwitchPremium
                checked={dayHours.is_active}
                onChange={(e) => 
                  handleHoursChange(day.value, 'is_active', e.target.checked)
                }
                label={dayHours.is_active ? 'Open' : 'Closed'}
              />
            </div>

            {dayHours.is_active && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Opening Time
                  </label>
                  <InputPremium
                    type="time"
                    value={dayHours.open_time?.slice(0, 5) || ''}
                    onChange={(e) => 
                      handleHoursChange(day.value, 'open_time', `${e.target.value}:00`)
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Closing Time
                  </label>
                  <InputPremium
                    type="time"
                    value={dayHours.close_time?.slice(0, 5) || ''}
                    onChange={(e) => 
                      handleHoursChange(day.value, 'close_time', `${e.target.value}:00`)
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Break Start (Optional)
                  </label>
                  <InputPremium
                    type="time"
                    value={dayHours.break_start?.slice(0, 5) || ''}
                    onChange={(e) => 
                      handleHoursChange(
                        day.value, 
                        'break_start', 
                        e.target.value ? `${e.target.value}:00` : null
                      )
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Break End (Optional)
                  </label>
                  <InputPremium
                    type="time"
                    value={dayHours.break_end?.slice(0, 5) || ''}
                    onChange={(e) => 
                      handleHoursChange(
                        day.value, 
                        'break_end', 
                        e.target.value ? `${e.target.value}:00` : null
                      )
                    }
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}

    </div>
  );
}