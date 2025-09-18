# Phone Guys Appointment Form - Astro Integration

A native Astro integration for the Phone Guys appointment booking system. No iframes, no scrolling issues - just a clean, responsive form that runs directly in your Astro site.

## 🚀 Quick Start

### 1. Install Dependencies

First, install React in your Astro project (if not already installed):

```bash
npm install react react-dom @astrojs/react
# or
yarn add react react-dom @astrojs/react
```

### 2. Configure Astro

Add React integration to your `astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()]
});
```

### 3. Copy Integration Files

Copy these files to your Astro project:

```
src/
  components/
    phoneguys/
      PhoneGuysAppointmentForm.tsx
      AppointmentForm.astro
      styles.css
```

### 4. Get Your API Key

1. Log into your Phone Guys Dashboard
2. Go to Settings → API Keys
3. Create a new API key for your website domain
4. Copy the key (starts with `tpg_`)

### 5. Add to Your Page

```astro
---
import AppointmentForm from '../components/phoneguys/AppointmentForm.astro';
---

<Layout title="Book an Appointment">
  <main>
    <h1>Schedule Your Device Repair</h1>
    
    <AppointmentForm 
      apiKey="tpg_YOUR_API_KEY_HERE"
      primaryColor="#06b6d4"
    />
  </main>
</Layout>
```

## 📦 Option 2: Direct React Component Usage

If you prefer to use the React component directly:

```astro
---
import PhoneGuysAppointmentForm from '../components/phoneguys/PhoneGuysAppointmentForm.tsx';
---

<Layout title="Book an Appointment">
  <main>
    <h1>Schedule Your Device Repair</h1>
    
    <PhoneGuysAppointmentForm 
      client:load
      apiKey="tpg_YOUR_API_KEY_HERE"
      primaryColor="#06b6d4"
      onSuccess={(data) => {
        console.log('Appointment booked!', data);
        // Redirect or show success message
      }}
      onError={(error) => {
        console.error('Booking failed:', error);
        // Show error message
      }}
    />
  </main>
</Layout>
```

## 🎨 Customization

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `apiKey` | string | ✅ | - | Your Phone Guys API key |
| `apiBaseUrl` | string | ❌ | `https://dashboard.phoneguysrepair.com/api/public` | API endpoint URL |
| `primaryColor` | string | ❌ | `#06b6d4` | Primary brand color for buttons and accents |
| `onSuccess` | function | ❌ | - | Callback when appointment is successfully booked |
| `onError` | function | ❌ | - | Callback when booking fails |

### Custom Styling

The form uses CSS classes with the `pg-` prefix to avoid conflicts. You can override any styles:

```css
/* Override primary button color */
.pg-submit-btn {
  background-color: #your-color !important;
}

/* Customize device cards */
.pg-device-card {
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* Adjust form container width */
.pg-form-container {
  max-width: 600px;
}
```

### Event Handling

Listen for custom events in your Astro component:

```astro
<script>
  // Listen for successful appointment booking
  window.addEventListener('phoneguys:appointment-success', (event) => {
    console.log('Appointment booked!', event.detail);
    // Show success message
    // Redirect to confirmation page
    // Track conversion in analytics
  });

  // Listen for errors
  window.addEventListener('phoneguys:appointment-error', (event) => {
    console.error('Booking failed:', event.detail);
    // Show error message to user
  });
</script>
```

## 🔧 Advanced Configuration

### Using Environment Variables

Store your API key securely in `.env`:

```env
PUBLIC_PHONEGUYS_API_KEY=tpg_YOUR_API_KEY_HERE
```

Then use in your component:

```astro
---
const apiKey = import.meta.env.PUBLIC_PHONEGUYS_API_KEY;
---

<AppointmentForm apiKey={apiKey} />
```

### Custom Success Page

Redirect to a custom success page after booking:

```jsx
<PhoneGuysAppointmentForm 
  client:load
  apiKey="tpg_YOUR_API_KEY"
  onSuccess={(data) => {
    // Store appointment data in sessionStorage
    sessionStorage.setItem('appointment', JSON.stringify(data));
    // Redirect to success page
    window.location.href = `/appointment-confirmed?id=${data.appointmentNumber}`;
  }}
/>
```

### Multi-Step Form Navigation

The form automatically handles multi-step navigation, but you can add custom behavior:

```css
/* Add smooth transitions between steps */
.pg-step {
  animation: slideIn 0.3s ease-in-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

## 📱 Mobile Responsive

The form is fully responsive out of the box. On mobile devices:
- Device and service grids stack vertically
- Time slots adjust to fit smaller screens
- Navigation buttons remain easily tappable
- Form inputs are optimized for touch

## 🔒 Security

- API keys are validated on each request
- All data is transmitted over HTTPS
- Customer consent is explicitly collected
- No sensitive data is stored in the browser

## 🆘 Troubleshooting

### Form not showing?

1. Check browser console for errors
2. Verify your API key is correct
3. Ensure your domain is whitelisted in the Phone Guys dashboard
4. Check that React is properly configured in Astro

### Getting CORS errors?

Make sure your domain is added to the allowed origins in your Phone Guys API settings.

### Styles not loading?

Ensure you've imported the `styles.css` file in your component or add it to your global styles.

## 📞 Support

- **Documentation**: https://dashboard.phoneguysrepair.com/docs
- **Email**: support@phoneguysrepair.com
- **Dashboard**: https://dashboard.phoneguysrepair.com

## 📄 License

This integration is provided as-is for use with the Phone Guys appointment system.

---

## Example Implementation

Here's a complete example page:

```astro
---
// src/pages/book-appointment.astro
import Layout from '../layouts/Layout.astro';
import AppointmentForm from '../components/phoneguys/AppointmentForm.astro';

const apiKey = import.meta.env.PUBLIC_PHONEGUYS_API_KEY;
---

<Layout title="Book Your Repair - Phone Guys">
  <main class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-4xl font-bold text-center mb-2">
        Book Your Device Repair
      </h1>
      <p class="text-center text-gray-600 mb-8">
        Schedule your appointment in just a few clicks
      </p>
      
      <AppointmentForm 
        apiKey={apiKey}
        primaryColor="#06b6d4"
        class="my-8"
      />
      
      <div class="mt-8 text-center text-sm text-gray-500">
        <p>Questions? Call us at (555) 555-5555</p>
        <p>Monday - Friday: 9am - 6pm | Saturday: 10am - 4pm</p>
      </div>
    </div>
  </main>
</Layout>

<script>
  // Track successful bookings
  window.addEventListener('phoneguys:appointment-success', (event) => {
    // Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'appointment_booked', {
        appointment_number: event.detail.appointmentNumber
      });
    }
    
    // Show success notification
    alert(`Success! Your appointment ${event.detail.appointmentNumber} has been confirmed.`);
  });
</script>

<style>
  /* Custom overrides */
  :global(.pg-form-container) {
    font-family: system-ui, sans-serif;
  }
  
  :global(.pg-submit-btn) {
    font-size: 1.125rem;
    padding: 1rem 2rem;
  }
</style>
```