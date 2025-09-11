# Astro Website Integration Guide

This guide will help you integrate The Phone Guys CRM appointment form into your Astro website.

## Prerequisites

1. An active Phone Guys CRM account with admin access
2. An Astro website where you want to embed the form
3. Basic knowledge of HTML/JavaScript

## Step 1: Generate an API Key

1. Log into your Phone Guys CRM dashboard
2. Navigate to **Admin → Website Integration → Settings**
3. Click on **Generate New Key** in the API Keys section
4. Fill in the following:
   - **Key Name**: Give it a descriptive name (e.g., "Main Website Form")
   - **Description**: Optional description for reference
   - **Allowed Domains**: Enter your website domains (one per line):
     ```
     yourdomain.com
     www.yourdomain.com
     localhost:4321
     ```
   - **Expiration**: Leave empty for no expiration, or set days until expiry
5. Click **Generate Key**
6. **IMPORTANT**: Copy and save the API key securely - it won't be shown again!

## Step 2: Create the Form Component in Astro

### Option A: Astro Component (Recommended)

Create a new file `src/components/AppointmentForm.astro`:

```astro
---
// src/components/AppointmentForm.astro
const API_KEY = import.meta.env.PUBLIC_PHONEGUYS_API_KEY || 'your-api-key-here';
const API_URL = import.meta.env.PUBLIC_PHONEGUYS_API_URL || 'https://your-crm-domain.com/api/public/appointment';
---

<div id="appointment-form-container">
  <form id="phoneguys-appointment-form" class="appointment-form">
    <h2>Schedule Your Repair</h2>
    
    <!-- Customer Information -->
    <div class="form-section">
      <h3>Your Information</h3>
      
      <div class="form-group">
        <label for="customerName">Full Name *</label>
        <input 
          type="text" 
          id="customerName" 
          name="customerName" 
          required 
          placeholder="John Doe"
        />
      </div>

      <div class="form-group">
        <label for="customerEmail">Email *</label>
        <input 
          type="email" 
          id="customerEmail" 
          name="customerEmail" 
          required 
          placeholder="john@example.com"
        />
      </div>

      <div class="form-group">
        <label for="customerPhone">Phone *</label>
        <input 
          type="tel" 
          id="customerPhone" 
          name="customerPhone" 
          required 
          placeholder="(555) 123-4567"
        />
      </div>
    </div>

    <!-- Device Information -->
    <div class="form-section">
      <h3>Device Information</h3>
      
      <div class="form-group">
        <label for="deviceName">Device Model *</label>
        <input 
          type="text" 
          id="deviceName" 
          name="deviceName" 
          required 
          placeholder="iPhone 14 Pro"
        />
      </div>

      <div class="form-group">
        <label for="deviceColor">Device Color</label>
        <input 
          type="text" 
          id="deviceColor" 
          name="deviceColor" 
          placeholder="Space Black"
        />
      </div>
    </div>

    <!-- Service Selection -->
    <div class="form-section">
      <h3>What needs fixing? *</h3>
      
      <div class="checkbox-group">
        <label>
          <input type="checkbox" name="services" value="Screen Repair" />
          <span>Screen Repair</span>
        </label>
        
        <label>
          <input type="checkbox" name="services" value="Battery Replacement" />
          <span>Battery Replacement</span>
        </label>
        
        <label>
          <input type="checkbox" name="services" value="Charging Port" />
          <span>Charging Port</span>
        </label>
        
        <label>
          <input type="checkbox" name="services" value="Water Damage" />
          <span>Water Damage</span>
        </label>
        
        <label>
          <input type="checkbox" name="services" value="Speaker Repair" />
          <span>Speaker Repair</span>
        </label>
        
        <label>
          <input type="checkbox" name="services" value="Camera Repair" />
          <span>Camera Repair</span>
        </label>
        
        <label>
          <input type="checkbox" name="services" value="Other" />
          <span>Other Issue</span>
        </label>
      </div>
    </div>

    <!-- Appointment Scheduling -->
    <div class="form-section">
      <h3>Preferred Appointment Time</h3>
      
      <div class="form-group">
        <label for="preferredDate">Preferred Date *</label>
        <input 
          type="date" 
          id="preferredDate" 
          name="preferredDate" 
          required 
          min={new Date().toISOString().split('T')[0]}
        />
      </div>

      <div class="form-group">
        <label for="preferredTime">Preferred Time *</label>
        <select id="preferredTime" name="preferredTime" required>
          <option value="">Select a time</option>
          <option value="09:00">9:00 AM</option>
          <option value="09:30">9:30 AM</option>
          <option value="10:00">10:00 AM</option>
          <option value="10:30">10:30 AM</option>
          <option value="11:00">11:00 AM</option>
          <option value="11:30">11:30 AM</option>
          <option value="12:00">12:00 PM</option>
          <option value="12:30">12:30 PM</option>
          <option value="13:00">1:00 PM</option>
          <option value="13:30">1:30 PM</option>
          <option value="14:00">2:00 PM</option>
          <option value="14:30">2:30 PM</option>
          <option value="15:00">3:00 PM</option>
          <option value="15:30">3:30 PM</option>
          <option value="16:00">4:00 PM</option>
          <option value="16:30">4:30 PM</option>
          <option value="17:00">5:00 PM</option>
          <option value="17:30">5:30 PM</option>
        </select>
      </div>
    </div>

    <!-- Additional Information -->
    <div class="form-section">
      <div class="form-group">
        <label for="description">Additional Details</label>
        <textarea 
          id="description" 
          name="description" 
          rows="4" 
          placeholder="Please describe the issue in more detail..."
        ></textarea>
      </div>
    </div>

    <!-- Submit Button -->
    <button type="submit" class="submit-button">
      Schedule Appointment
    </button>
    
    <div id="form-message" class="form-message"></div>
  </form>
</div>

<style>
  .appointment-form {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  .form-section {
    margin-bottom: 2rem;
  }

  .form-section h3 {
    margin-bottom: 1rem;
    color: #333;
    font-size: 1.2rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #555;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    transition: border-color 0.3s;
  }

  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #0ea5e9;
  }

  .checkbox-group {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.75rem;
  }

  .checkbox-group label {
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  .checkbox-group input[type="checkbox"] {
    margin-right: 0.5rem;
  }

  .submit-button {
    width: 100%;
    padding: 1rem;
    background: #0ea5e9;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.3s;
  }

  .submit-button:hover {
    background: #0284c7;
  }

  .submit-button:disabled {
    background: #94a3b8;
    cursor: not-allowed;
  }

  .form-message {
    margin-top: 1rem;
    padding: 1rem;
    border-radius: 4px;
    text-align: center;
    display: none;
  }

  .form-message.success {
    display: block;
    background: #10b981;
    color: white;
  }

  .form-message.error {
    display: block;
    background: #ef4444;
    color: white;
  }

  .loading {
    opacity: 0.6;
    pointer-events: none;
  }
</style>

<script define:vars={{ API_KEY, API_URL }}>
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('phoneguys-appointment-form');
    const messageDiv = document.getElementById('form-message');
    const submitButton = form.querySelector('.submit-button');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Clear previous messages
      messageDiv.className = 'form-message';
      messageDiv.textContent = '';
      
      // Disable form while submitting
      form.classList.add('loading');
      submitButton.disabled = true;
      submitButton.textContent = 'Submitting...';

      // Collect form data
      const formData = new FormData(form);
      
      // Get selected services
      const services = [];
      formData.getAll('services').forEach(service => {
        services.push(service);
      });

      // Prepare data object
      const data = {
        customerName: formData.get('customerName'),
        customerEmail: formData.get('customerEmail'),
        customerPhone: formData.get('customerPhone'),
        deviceName: formData.get('deviceName'),
        deviceColor: formData.get('deviceColor'),
        services: services,
        preferredDate: formData.get('preferredDate'),
        preferredTime: formData.get('preferredTime'),
        description: formData.get('description')
      };

      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY
          },
          body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
          // Success
          messageDiv.className = 'form-message success';
          messageDiv.textContent = result.message || 'Appointment request submitted successfully!';
          
          if (result.appointmentNumber) {
            messageDiv.textContent += ` Your appointment number is: ${result.appointmentNumber}`;
          }
          
          // Reset form
          form.reset();
        } else {
          // Error
          messageDiv.className = 'form-message error';
          messageDiv.textContent = result.error || 'Failed to submit appointment request. Please try again.';
        }
      } catch (error) {
        console.error('Error submitting form:', error);
        messageDiv.className = 'form-message error';
        messageDiv.textContent = 'Network error. Please check your connection and try again.';
      } finally {
        // Re-enable form
        form.classList.remove('loading');
        submitButton.disabled = false;
        submitButton.textContent = 'Schedule Appointment';
      }
    });
  });
</script>
```

### Option B: React Component (for Astro with React)

If your Astro site uses React, create `src/components/AppointmentForm.jsx`:

```jsx
import React, { useState } from 'react';

const API_KEY = import.meta.env.PUBLIC_PHONEGUYS_API_KEY || 'your-api-key-here';
const API_URL = import.meta.env.PUBLIC_PHONEGUYS_API_URL || 'https://your-crm-domain.com/api/public/appointment';

export default function AppointmentForm() {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    deviceName: '',
    deviceColor: '',
    services: [],
    preferredDate: '',
    preferredTime: '',
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: result.message || 'Appointment submitted successfully!'
        });
        // Reset form
        setFormData({
          customerName: '',
          customerEmail: '',
          customerPhone: '',
          deviceName: '',
          deviceColor: '',
          services: [],
          preferredDate: '',
          preferredTime: '',
          description: ''
        });
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to submit appointment'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Network error. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Component JSX here...
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

## Step 3: Environment Variables

Add these to your `.env` file:

```env
PUBLIC_PHONEGUYS_API_KEY=tpg_your_actual_api_key_here
PUBLIC_PHONEGUYS_API_URL=https://your-crm-domain.com/api/public/appointment
```

## Step 4: Add the Form to Your Page

In your Astro page (e.g., `src/pages/repair.astro`):

```astro
---
import Layout from '../layouts/Layout.astro';
import AppointmentForm from '../components/AppointmentForm.astro';
---

<Layout title="Schedule a Repair">
  <main>
    <h1>Schedule Your Device Repair</h1>
    <AppointmentForm />
  </main>
</Layout>
```

## Step 5: Testing

1. Start your Astro development server:
   ```bash
   npm run dev
   ```

2. Navigate to your form page

3. Test the form submission with sample data

4. Check your Phone Guys CRM dashboard under **Form Submissions** to see the test submission

## Security Best Practices

1. **Never commit API keys to version control**
   - Use environment variables
   - Add `.env` to `.gitignore`

2. **Always use HTTPS in production**
   - The API requires secure connections

3. **Configure domain whitelisting**
   - Only allow your production domains
   - Remove localhost when going live

4. **Set API key expiration**
   - Rotate keys periodically
   - Set reasonable expiration dates

5. **Monitor API usage**
   - Check logs regularly in the CRM dashboard
   - Watch for unusual activity

## Troubleshooting

### CORS Errors
- Ensure your domain is added to the allowed domains list
- Check that the domain matches exactly (including www)

### API Key Invalid
- Verify the key is active in the CRM dashboard
- Check if the key has expired
- Ensure you're using the correct environment variable

### Form Not Submitting
- Check browser console for JavaScript errors
- Verify all required fields are filled
- Ensure the API URL is correct

### 500 Errors
- Check if the CRM service is running
- Verify your API key has the correct permissions
- Contact support if the issue persists

## Support

For additional help:
- Check the API logs in your CRM dashboard
- Review the form submissions section for debugging
- Contact The Phone Guys support team

## API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Your appointment request has been submitted successfully!",
  "submissionId": "uuid",
  "appointmentNumber": "APT-20240115-001",
  "estimatedResponse": "24 hours"
}
```

### Error Response
```json
{
  "error": "Description of the error"
}
```

## Customization

You can customize the form styling to match your website's design. The provided CSS is just a starting point. Feel free to:

- Adjust colors to match your brand
- Modify spacing and layout
- Add animations and transitions
- Implement your own validation
- Add additional fields as needed

## Advanced Features

### Custom Validation
Add client-side validation before submission:

```javascript
// Phone number validation
const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
if (!phoneRegex.test(formData.customerPhone)) {
  alert('Please enter a valid phone number');
  return;
}
```

### Loading States
Show a spinner or progress indicator while submitting:

```javascript
submitButton.innerHTML = '<span class="spinner"></span> Submitting...';
```

### Success Redirect
Redirect to a thank you page after successful submission:

```javascript
if (response.ok) {
  window.location.href = '/thank-you?appointment=' + result.appointmentNumber;
}
```

## Changelog

- **v1.0.0** - Initial release with basic form submission
- **v1.0.1** - Added API key authentication
- **v1.0.2** - Added domain whitelisting and CORS support

---

Last updated: January 2025