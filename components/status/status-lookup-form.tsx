'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { Search, Loader2, Ticket, Calendar } from 'lucide-react';

interface StatusLookupFormProps {
  onSubmit: (type: 'ticket' | 'appointment', identifier: string, email: string) => void;
  isLoading?: boolean;
}

export function StatusLookupForm({ onSubmit, isLoading = false }: StatusLookupFormProps) {
  const [type, setType] = useState<'ticket' | 'appointment'>('ticket');
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ identifier?: string; email?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { identifier?: string; email?: string } = {};

    // Validate identifier
    if (!identifier.trim()) {
      newErrors.identifier = `${type === 'ticket' ? 'Ticket' : 'Appointment'} number is required`;
    } else {
      // Accept multiple formats: TPG0003, TKT0003, TKT-20250106-001
      const pattern = type === 'ticket' 
        ? /^(TKT-\d{8}-\d{3}|TKT\d{4}|TPG\d{4})$/i 
        : /^(APT-\d{8}-\d{3}|APT\d{4})$/i;
      
      if (!pattern.test(identifier.trim())) {
        newErrors.identifier = `Invalid ${type === 'ticket' ? 'ticket' : 'appointment'} number format`;
      }
    }

    // Validate email
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(type, identifier.trim().toUpperCase(), email.trim().toLowerCase());
    }
  };

  const handleTypeChange = (value: string) => {
    setType(value as 'ticket' | 'appointment');
    setIdentifier(''); // Clear identifier when type changes
    setErrors({}); // Clear errors
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Type Selection */}
      <div>
        <Label className="text-base font-medium text-gray-900 mb-3 block">
          What are you looking for?
        </Label>
        <RadioGroup value={type} onValueChange={handleTypeChange}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card 
              className={`p-4 cursor-pointer transition-all ${
                type === 'ticket' 
                  ? 'border-cyan-500 bg-cyan-50/50 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleTypeChange('ticket')}
            >
              <label className="flex items-center space-x-3 cursor-pointer">
                <RadioGroupItem value="ticket" />
                <div className="flex items-center space-x-2">
                  <Ticket className="h-5 w-5 text-cyan-600" />
                  <div>
                    <p className="font-medium">Repair Ticket</p>
                    <p className="text-sm text-gray-500">For devices already in repair</p>
                  </div>
                </div>
              </label>
            </Card>
            
            <Card 
              className={`p-4 cursor-pointer transition-all ${
                type === 'appointment' 
                  ? 'border-cyan-500 bg-cyan-50/50 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleTypeChange('appointment')}
            >
              <label className="flex items-center space-x-3 cursor-pointer">
                <RadioGroupItem value="appointment" />
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-cyan-600" />
                  <div>
                    <p className="font-medium">Appointment</p>
                    <p className="text-sm text-gray-500">For scheduled appointments</p>
                  </div>
                </div>
              </label>
            </Card>
          </div>
        </RadioGroup>
      </div>

      {/* Reference Number Input */}
      <div>
        <Label htmlFor="identifier">
          {type === 'ticket' ? 'Ticket Number' : 'Appointment Number'}
        </Label>
        <Input
          id="identifier"
          type="text"
          value={identifier}
          onChange={(e) => {
            setIdentifier(e.target.value.toUpperCase());
            setErrors(prev => ({ ...prev, identifier: undefined }));
          }}
          placeholder={type === 'ticket' ? 'TPG0003' : 'APT0007'}
          className={`mt-1 ${errors.identifier ? 'border-red-500' : ''}`}
          disabled={isLoading}
        />
        {errors.identifier && (
          <p className="mt-1 text-sm text-red-600">{errors.identifier}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          You can find this in your confirmation email or receipt
        </p>
      </div>

      {/* Email Input */}
      <div>
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setErrors(prev => ({ ...prev, email: undefined }));
          }}
          placeholder="your@email.com"
          className={`mt-1 ${errors.email ? 'border-red-500' : ''}`}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Use the email address associated with your {type === 'ticket' ? 'repair' : 'appointment'}
        </p>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full bg-cyan-600 hover:bg-cyan-700"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Checking Status...
          </>
        ) : (
          <>
            <Search className="mr-2 h-4 w-4" />
            Check Status
          </>
        )}
      </Button>

      {/* Example Format */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm">
        <p className="font-medium text-gray-700 mb-2">Example Format:</p>
        <div className="space-y-1 text-gray-600">
          <p>
            <span className="font-mono bg-white px-2 py-1 rounded">
              {type === 'ticket' ? 'TPG0003 or TKT0001' : 'APT0007'}
            </span>
          </p>
          <p className="text-xs">
            {type === 'ticket' 
              ? 'Ticket numbers start with TPG or TKT followed by 4 digits'
              : 'Appointment numbers start with APT followed by 4 digits'}
          </p>
        </div>
      </div>
    </form>
  );
}