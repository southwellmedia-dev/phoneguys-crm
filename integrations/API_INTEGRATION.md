# Phone Guys CRM - API Integration Guide

Build your own custom appointment form and integrate directly with our API. Full control over design and user experience while leveraging our backend for appointment management, notifications, and more.

## 🔑 Getting Started

### 1. Get Your API Key

1. Log into your Phone Guys Dashboard at https://dashboard.phoneguysrepair.com
2. Navigate to **Settings → API Keys**
3. Create a new API key for your domain
4. Copy the key (format: `tpg_XXXXXXXXXX`)

### 2. API Base URL

All API requests should be made to:
```
https://dashboard.phoneguysrepair.com/api/public
```

For local development/testing:
```
http://localhost:3001/api/public
```

### 3. Authentication

Include your API key in all requests:
```javascript
headers: {
  'x-api-key': 'tpg_YOUR_API_KEY_HERE',
  'Content-Type': 'application/json'
}
```

## 📋 Available Endpoints

### 1. Get Available Devices
Fetch the list of devices you service.

**Endpoint:** `GET /devices`

**Response:**
```json
{
  "success": true,
  "data": {
    "devices": [
      {
        "id": "uuid-here",
        "manufacturer": {
          "id": "uuid",
          "name": "Apple"
        },
        "model_name": "iPhone 15 Pro",
        "type": "phone",
        "release_year": 2023
      }
      // ... more devices
    ]
  }
}
```

### 2. Get Available Services
Fetch the services/repairs you offer.

**Endpoint:** `GET /services`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-here",
      "name": "Screen Replacement",
      "category": "screen_repair",
      "base_price": 99.99,
      "description": "Replace cracked or damaged screen",
      "average_duration": 30
    }
    // ... more services
  ]
}
```

### 3. Check Availability
Get available appointment slots for a specific date.

**Endpoint:** `GET /availability?date=2024-01-15`

**Parameters:**
- `date` (required): Date in YYYY-MM-DD format

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2024-01-15",
    "slots": [
      {
        "time": "09:00",
        "available": true
      },
      {
        "time": "09:30",
        "available": true
      },
      {
        "time": "10:00",
        "available": false
      }
      // ... more time slots
    ]
  }
}
```

### 4. Create Appointment
Submit a new appointment request.

**Endpoint:** `POST /appointments`

**Request Body:**
```json
{
  "device": {
    "deviceId": "uuid-from-devices-endpoint",
    "serialNumber": "XXXXXXXXXXXX",        // Optional
    "imei": "XXXXXXXXXXXXXXX",             // Optional
    "color": "Space Gray",                 // Optional
    "storageSize": "256GB",                // Optional
    "condition": "Good"                    // Optional
  },
  "issues": ["service-uuid-1", "service-uuid-2"],  // Array of service IDs
  "issueDescription": "Screen is cracked in corner, touch still works",  // Optional
  "appointmentDate": "2024-01-15",
  "appointmentTime": "10:00",
  "duration": 30,                          // Duration in minutes
  "customer": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+15551234567",
    "address": "123 Main St, City, ST 12345"  // Optional
  },
  "consent": {
    "email": true,                         // Email notification consent
    "sms": true                            // SMS notification consent
  },
  "source": "website",                     // Always use "website"
  "sourceUrl": "https://yoursite.com/book", // Optional - your booking page URL
  "notes": "Please call before appointment"  // Optional - additional notes
}
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "appointmentId": "uuid-here",
    "appointmentNumber": "APT-2024-0001",
    "status": "scheduled",
    "scheduledDate": "2024-01-15",
    "scheduledTime": "10:00",
    "formattedDate": "Monday, January 15, 2024",
    "formattedTime": "10:00 AM",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "confirmationTitle": "Appointment Confirmed!",
    "message": "Your appointment has been confirmed for Monday, January 15, 2024 at 10:00 AM. Confirmation number: APT-2024-0001."
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Time slot unavailable",
  "message": "The selected time slot is no longer available. Please choose another time."
}
```

## 🔨 Implementation Examples

### Vanilla JavaScript
```javascript
async function bookAppointment(formData) {
  try {
    const response = await fetch('https://dashboard.phoneguysrepair.com/api/public/appointments', {
      method: 'POST',
      headers: {
        'x-api-key': 'tpg_YOUR_API_KEY',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();
    
    if (data.success) {
      // Handle success
      console.log('Appointment booked:', data.data.appointmentNumber);
      // Redirect to success page or show confirmation
      window.location.href = `/appointment-confirmed?id=${data.data.appointmentNumber}`;
    } else {
      // Handle error
      alert(data.error || 'Booking failed');
    }
  } catch (error) {
    console.error('Booking error:', error);
    alert('Network error. Please try again.');
  }
}
```

### Astro Component Example
```astro
---
// AppointmentForm.astro
const API_KEY = import.meta.env.PUBLIC_PHONEGUYS_API_KEY;
const API_URL = 'https://dashboard.phoneguysrepair.com/api/public';

// Fetch devices and services for the form
const devicesResponse = await fetch(`${API_URL}/devices`, {
  headers: { 'x-api-key': API_KEY }
});
const devices = await devicesResponse.json();

const servicesResponse = await fetch(`${API_URL}/services`, {
  headers: { 'x-api-key': API_KEY }
});
const services = await servicesResponse.json();
---

<form id="appointment-form">
  <!-- Step 1: Device Selection -->
  <div class="form-step">
    <h2>Select Your Device</h2>
    <select name="deviceId" required>
      <option value="">Choose a device...</option>
      {devices.data.devices.map(device => (
        <option value={device.id}>
          {device.manufacturer.name} {device.model_name}
        </option>
      ))}
    </select>
  </div>

  <!-- Step 2: Services -->
  <div class="form-step">
    <h2>What needs repair?</h2>
    {services.data.map(service => (
      <label>
        <input type="checkbox" name="issues" value={service.id} />
        {service.name} - Starting at ${service.base_price}
      </label>
    ))}
  </div>

  <!-- Step 3: Schedule -->
  <div class="form-step">
    <h2>Pick a Date & Time</h2>
    <input type="date" name="appointmentDate" required />
    <select name="appointmentTime" required>
      <!-- Populate with available times from API -->
    </select>
  </div>

  <!-- Step 4: Contact Info -->
  <div class="form-step">
    <h2>Your Information</h2>
    <input type="text" name="name" placeholder="Full Name" required />
    <input type="email" name="email" placeholder="Email" required />
    <input type="tel" name="phone" placeholder="Phone" required />
  </div>

  <button type="submit">Book Appointment</button>
</form>

<script define:vars={{ API_KEY, API_URL }}>
  document.getElementById('appointment-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    // Build request body
    const appointmentData = {
      device: {
        deviceId: formData.get('deviceId')
      },
      issues: formData.getAll('issues'),
      appointmentDate: formData.get('appointmentDate'),
      appointmentTime: formData.get('appointmentTime'),
      duration: 30,
      customer: {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone')
      },
      consent: {
        email: true,
        sms: true
      },
      source: 'website'
    };

    try {
      const response = await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appointmentData)
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Appointment confirmed! Your confirmation number is: ${result.data.appointmentNumber}`);
      } else {
        alert(result.error || 'Booking failed');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  });
</script>
```

### React Example
```jsx
import { useState, useEffect } from 'react';

function AppointmentForm({ apiKey }) {
  const [devices, setDevices] = useState([]);
  const [services, setServices] = useState([]);
  const [formData, setFormData] = useState({
    device: { deviceId: '' },
    issues: [],
    appointmentDate: '',
    appointmentTime: '',
    customer: { name: '', email: '', phone: '' }
  });

  useEffect(() => {
    // Fetch devices and services
    fetchDevices();
    fetchServices();
  }, []);

  const fetchDevices = async () => {
    const response = await fetch('https://dashboard.phoneguysrepair.com/api/public/devices', {
      headers: { 'x-api-key': apiKey }
    });
    const data = await response.json();
    setDevices(data.data.devices);
  };

  const fetchServices = async () => {
    const response = await fetch('https://dashboard.phoneguysrepair.com/api/public/services', {
      headers: { 'x-api-key': apiKey }
    });
    const data = await response.json();
    setServices(data.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const response = await fetch('https://dashboard.phoneguysrepair.com/api/public/appointments', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...formData,
        duration: 30,
        consent: { email: true, sms: true },
        source: 'website'
      })
    });

    const result = await response.json();
    if (result.success) {
      alert(`Booked! Confirmation: ${result.data.appointmentNumber}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Your custom form UI here */}
    </form>
  );
}
```

## 🎨 What Happens After Submission?

When an appointment is successfully created through your form:

1. **Customer receives:**
   - Confirmation email with appointment details
   - SMS confirmation (if consent given)
   - Appointment number for reference

2. **Your dashboard shows:**
   - New appointment in the system
   - Customer information
   - Selected services
   - Appointment status tracking

3. **Automatic notifications for:**
   - Appointment confirmations
   - When work begins on the device
   - When device is ready for pickup
   - Any status changes

## 🔒 Security Best Practices

1. **Never expose your API key in client-side code**
   - Use environment variables
   - Or proxy through your backend

2. **Validate input on your frontend**
   - Check required fields
   - Validate email/phone formats
   - Ensure date is in the future

3. **Handle errors gracefully**
   - Show user-friendly error messages
   - Log errors for debugging
   - Provide fallback options

## 🧪 Testing

Use these test values during development:

- **Test API Key**: Contact support for a sandbox key
- **Test Phone**: Use any valid format (SMS won't actually send in test mode)
- **Test Email**: Use any valid email format

## 📊 Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid API key |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Time slot no longer available |
| 500 | Server Error - Try again later |

## 🆘 Common Issues

### CORS Errors
Make sure your domain is whitelisted in your API settings in the Phone Guys dashboard.

### Time Slot Unavailable
Fetch fresh availability data before showing time slots to users.

### API Key Invalid
Ensure you're using the correct API key and it's active for your domain.

## 📞 Support

- **Documentation**: https://dashboard.phoneguysrepair.com/docs
- **Email**: support@phoneguysrepair.com
- **Dashboard**: https://dashboard.phoneguysrepair.com

---

## Complete Working Example (HTML + JavaScript)

```html
<!DOCTYPE html>
<html>
<head>
    <title>Book Your Repair</title>
    <style>
        .form-container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
        }
        input, select, textarea {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        button {
            background: #06b6d4;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        .service-option {
            padding: 10px;
            margin: 5px 0;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="form-container">
        <h1>Book Your Device Repair</h1>
        
        <form id="appointmentForm">
            <!-- Device Selection -->
            <div class="form-group">
                <label>Select Your Device:</label>
                <select id="deviceSelect" name="deviceId" required>
                    <option value="">Loading devices...</option>
                </select>
            </div>

            <!-- Services -->
            <div class="form-group">
                <label>What needs repair?</label>
                <div id="servicesContainer">
                    Loading services...
                </div>
            </div>

            <!-- Date & Time -->
            <div class="form-group">
                <label>Appointment Date:</label>
                <input type="date" id="appointmentDate" required>
            </div>

            <div class="form-group">
                <label>Appointment Time:</label>
                <select id="appointmentTime" required>
                    <option value="">Select a date first</option>
                </select>
            </div>

            <!-- Contact Info -->
            <div class="form-group">
                <label>Your Name:</label>
                <input type="text" id="customerName" required>
            </div>

            <div class="form-group">
                <label>Email:</label>
                <input type="email" id="customerEmail" required>
            </div>

            <div class="form-group">
                <label>Phone:</label>
                <input type="tel" id="customerPhone" required>
            </div>

            <button type="submit">Book Appointment</button>
        </form>
    </div>

    <script>
        const API_KEY = 'tpg_YOUR_API_KEY_HERE';
        const API_URL = 'https://dashboard.phoneguysrepair.com/api/public';

        // Load devices on page load
        async function loadDevices() {
            const response = await fetch(`${API_URL}/devices`, {
                headers: { 'x-api-key': API_KEY }
            });
            const data = await response.json();
            
            const select = document.getElementById('deviceSelect');
            select.innerHTML = '<option value="">Choose a device...</option>';
            
            data.data.devices.forEach(device => {
                const option = document.createElement('option');
                option.value = device.id;
                option.textContent = `${device.manufacturer.name} ${device.model_name}`;
                select.appendChild(option);
            });
        }

        // Load services on page load
        async function loadServices() {
            const response = await fetch(`${API_URL}/services`, {
                headers: { 'x-api-key': API_KEY }
            });
            const data = await response.json();
            
            const container = document.getElementById('servicesContainer');
            container.innerHTML = '';
            
            data.data.forEach(service => {
                const div = document.createElement('div');
                div.className = 'service-option';
                div.innerHTML = `
                    <label>
                        <input type="checkbox" name="service" value="${service.id}">
                        ${service.name} - Starting at $${service.base_price}
                    </label>
                `;
                container.appendChild(div);
            });
        }

        // Load available times when date changes
        document.getElementById('appointmentDate').addEventListener('change', async (e) => {
            const date = e.target.value;
            const response = await fetch(`${API_URL}/availability?date=${date}`, {
                headers: { 'x-api-key': API_KEY }
            });
            const data = await response.json();
            
            const select = document.getElementById('appointmentTime');
            select.innerHTML = '';
            
            data.data.slots.filter(slot => slot.available).forEach(slot => {
                const option = document.createElement('option');
                option.value = slot.time;
                option.textContent = slot.time;
                select.appendChild(option);
            });
        });

        // Handle form submission
        document.getElementById('appointmentForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Collect selected services
            const selectedServices = [];
            document.querySelectorAll('input[name="service"]:checked').forEach(cb => {
                selectedServices.push(cb.value);
            });

            const appointmentData = {
                device: {
                    deviceId: document.getElementById('deviceSelect').value
                },
                issues: selectedServices,
                appointmentDate: document.getElementById('appointmentDate').value,
                appointmentTime: document.getElementById('appointmentTime').value,
                duration: 30,
                customer: {
                    name: document.getElementById('customerName').value,
                    email: document.getElementById('customerEmail').value,
                    phone: document.getElementById('customerPhone').value
                },
                consent: {
                    email: true,
                    sms: true
                },
                source: 'website'
            };

            try {
                const response = await fetch(`${API_URL}/appointments`, {
                    method: 'POST',
                    headers: {
                        'x-api-key': API_KEY,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(appointmentData)
                });

                const result = await response.json();
                
                if (result.success) {
                    alert(`Success! Your appointment number is: ${result.data.appointmentNumber}`);
                    // Redirect or show confirmation
                } else {
                    alert(result.error || 'Booking failed. Please try again.');
                }
            } catch (error) {
                alert('Network error. Please try again.');
                console.error(error);
            }
        });

        // Initialize
        loadDevices();
        loadServices();
    </script>
</body>
</html>
```