import React, { useState, useEffect } from 'react';
import './styles.css';

interface Device {
  id: string;
  manufacturer: { name: string };
  model_name: string;
  type: string;
}

interface Service {
  id: string;
  name: string;
  category: string;
  base_price?: number;
  description?: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface PhoneGuysFormProps {
  apiKey: string;
  apiBaseUrl?: string;
  primaryColor?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export default function PhoneGuysAppointmentForm({
  apiKey,
  apiBaseUrl = 'https://dashboard.phoneguysrepair.com/api/public',
  primaryColor = '#06b6d4',
  onSuccess,
  onError
}: PhoneGuysFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [formData, setFormData] = useState({
    device: {
      deviceId: '',
      name: '',
      manufacturer: '',
      serialNumber: '',
      imei: '',
      color: '',
      storageSize: '',
      condition: ''
    },
    issues: [] as string[],
    issueDescription: '',
    appointmentDate: '',
    appointmentTime: '',
    duration: 30,
    customer: {
      name: '',
      email: '',
      phone: '',
      address: ''
    },
    consent: {
      email: true,
      sms: true
    },
    source: 'website' as const,
    sourceUrl: typeof window !== 'undefined' ? window.location.href : ''
  });

  // Fetch devices on mount
  useEffect(() => {
    fetchDevices();
    fetchServices();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/devices`, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setDevices(data.data.devices || []);
      }
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/services`, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setServices(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    }
  };

  const fetchAvailability = async (date: string, retryCount = 0) => {
    const maxRetries = 3;
    const retryDelay = 1000 * Math.pow(2, retryCount); // Exponential backoff
    
    // Set loading state on first attempt
    if (retryCount === 0) {
      setSlotsLoading(true);
      setSlotsError(null);
    }
    
    try {
      const response = await fetch(`${apiBaseUrl}/availability?date=${date}`, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Check for warnings
        if (data.warnings && data.warnings.length > 0) {
          console.warn('Availability warnings:', data.warnings);
        }
        
        // Handle the response based on the structure
        if (data.data) {
          if (data.data.slots) {
            // Direct date availability response
            setAvailableSlots(data.data.slots || []);
          } else if (Array.isArray(data.data)) {
            // Array of slots
            setAvailableSlots(data.data);
          } else if (data.data.days) {
            // Week availability response - extract slots for the specific date
            const dayData = data.data.days.find((d: any) => d.date === date);
            setAvailableSlots(dayData?.slots || []);
          }
        } else {
          setAvailableSlots([]);
        }
        
        setSlotsLoading(false);
        return true; // Success
      } else {
        // Handle error response
        console.error('Availability error:', data.error, data.message);
        
        // Retry if it's a temporary failure
        if (response.status === 503 && retryCount < maxRetries) {
          console.log(`Retrying availability fetch (attempt ${retryCount + 1}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return fetchAvailability(date, retryCount + 1);
        }
        
        setSlotsError(data.message || 'Unable to load available time slots. Please try again or contact support.');
        setAvailableSlots([]);
        setSlotsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Failed to fetch availability:', error);
      
      // Retry on network errors
      if (retryCount < maxRetries) {
        console.log(`Retrying after network error (attempt ${retryCount + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return fetchAvailability(date, retryCount + 1);
      }
      
      setSlotsError('Unable to connect to our scheduling system. Please check your connection and try again.');
      setAvailableSlots([]);
      setSlotsLoading(false);
      return false;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/appointments`, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCurrentStep(6); // Show confirmation
        if (onSuccess) {
          onSuccess(data.data);
        }
      } else {
        throw new Error(data.error || 'Failed to submit appointment');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      if (onError) {
        onError(error);
      }
      alert('Failed to submit appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="pg-step">
            <h2 className="pg-step-title">Select Your Device</h2>
            <div className="pg-device-grid">
              {devices.map(device => (
                <button
                  key={device.id}
                  onClick={() => {
                    updateFormData('device', {
                      ...formData.device,
                      deviceId: device.id,
                      name: `${device.manufacturer.name} ${device.model_name}`,
                      manufacturer: device.manufacturer.name
                    });
                    nextStep();
                  }}
                  className={`pg-device-card ${formData.device.deviceId === device.id ? 'selected' : ''}`}
                >
                  <div className="pg-device-name">{device.manufacturer.name}</div>
                  <div className="pg-device-model">{device.model_name}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="pg-step">
            <h2 className="pg-step-title">What issues are you experiencing?</h2>
            <div className="pg-issues-grid">
              {services.map(service => (
                <label key={service.id} className="pg-issue-card">
                  <input
                    type="checkbox"
                    checked={formData.issues.includes(service.id)}
                    onChange={(e) => {
                      const issues = e.target.checked
                        ? [...formData.issues, service.id]
                        : formData.issues.filter(id => id !== service.id);
                      updateFormData('issues', issues);
                    }}
                  />
                  <div className="pg-issue-content">
                    <div className="pg-issue-name">{service.name}</div>
                    {service.base_price && (
                      <div className="pg-issue-price">Starting at ${service.base_price}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
            <div className="pg-form-group">
              <label>Additional Details (Optional)</label>
              <textarea
                value={formData.issueDescription}
                onChange={(e) => updateFormData('issueDescription', e.target.value)}
                placeholder="Describe the issues in more detail..."
                rows={3}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="pg-step">
            <h2 className="pg-step-title">Schedule Your Appointment</h2>
            <div className="pg-form-group">
              <label>Select Date</label>
              <input
                type="date"
                value={formData.appointmentDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => {
                  updateFormData('appointmentDate', e.target.value);
                  fetchAvailability(e.target.value);
                }}
              />
            </div>
            {formData.appointmentDate && availableSlots.length > 0 && (
              <div className="pg-form-group">
                <label>Select Time</label>
                <div className="pg-time-grid">
                  {availableSlots.filter(slot => slot.available).map(slot => (
                    <button
                      key={slot.time}
                      onClick={() => updateFormData('appointmentTime', slot.time)}
                      className={`pg-time-slot ${formData.appointmentTime === slot.time ? 'selected' : ''}`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="pg-step">
            <h2 className="pg-step-title">Contact Information</h2>
            <div className="pg-form-group">
              <label>Name *</label>
              <input
                type="text"
                value={formData.customer.name}
                onChange={(e) => updateFormData('customer', { ...formData.customer, name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="pg-form-group">
              <label>Email *</label>
              <input
                type="email"
                value={formData.customer.email}
                onChange={(e) => updateFormData('customer', { ...formData.customer, email: e.target.value })}
                placeholder="john@example.com"
                required
              />
            </div>
            <div className="pg-form-group">
              <label>Phone *</label>
              <input
                type="tel"
                value={formData.customer.phone}
                onChange={(e) => updateFormData('customer', { ...formData.customer, phone: e.target.value })}
                placeholder="(555) 555-5555"
                required
              />
            </div>
            <div className="pg-form-group">
              <label>Address (Optional)</label>
              <input
                type="text"
                value={formData.customer.address}
                onChange={(e) => updateFormData('customer', { ...formData.customer, address: e.target.value })}
                placeholder="123 Main St, City, State"
              />
            </div>
            <div className="pg-consent">
              <label>
                <input
                  type="checkbox"
                  checked={formData.consent.email}
                  onChange={(e) => updateFormData('consent', { ...formData.consent, email: e.target.checked })}
                />
                I consent to receive email updates
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.consent.sms}
                  onChange={(e) => updateFormData('consent', { ...formData.consent, sms: e.target.checked })}
                />
                I consent to receive SMS updates
              </label>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="pg-step">
            <h2 className="pg-step-title">Review & Confirm</h2>
            <div className="pg-summary">
              <div className="pg-summary-section">
                <h3>Device</h3>
                <p>{formData.device.name}</p>
              </div>
              <div className="pg-summary-section">
                <h3>Issues</h3>
                <ul>
                  {formData.issues.map(id => {
                    const service = services.find(s => s.id === id);
                    return <li key={id}>{service?.name}</li>;
                  })}
                </ul>
              </div>
              <div className="pg-summary-section">
                <h3>Appointment</h3>
                <p>{formData.appointmentDate} at {formData.appointmentTime}</p>
              </div>
              <div className="pg-summary-section">
                <h3>Contact</h3>
                <p>{formData.customer.name}</p>
                <p>{formData.customer.email}</p>
                <p>{formData.customer.phone}</p>
              </div>
            </div>
            <button 
              onClick={handleSubmit} 
              disabled={loading}
              className="pg-submit-btn"
              style={{ backgroundColor: primaryColor }}
            >
              {loading ? 'Submitting...' : 'Confirm Appointment'}
            </button>
          </div>
        );

      case 6:
        return (
          <div className="pg-step pg-confirmation">
            <div className="pg-success-icon">✓</div>
            <h2 className="pg-step-title">Appointment Confirmed!</h2>
            <p>Thank you for scheduling your appointment. You will receive a confirmation email shortly.</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="pg-form-container">
      <div className="pg-progress">
        <div 
          className="pg-progress-bar" 
          style={{ 
            width: `${(currentStep / 6) * 100}%`,
            backgroundColor: primaryColor 
          }}
        />
      </div>

      <div className="pg-form-content">
        {renderStep()}
      </div>

      {currentStep < 5 && currentStep > 0 && (
        <div className="pg-navigation">
          {currentStep > 1 && (
            <button onClick={prevStep} className="pg-nav-btn pg-nav-prev">
              Previous
            </button>
          )}
          {currentStep < 5 && formData.device.deviceId && (
            <button onClick={nextStep} className="pg-nav-btn pg-nav-next">
              Next
            </button>
          )}
        </div>
      )}
    </div>
  );
}