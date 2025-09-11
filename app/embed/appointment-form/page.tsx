import { FormContainer } from '@/components/public-form/FormContainer';

export default function EmbedAppointmentForm() {
  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-2xl mx-auto">
        <div className="space-y-4">
          <div className="text-center pb-4 border-b">
            <h1 className="text-2xl font-semibold">Schedule Your Repair</h1>
            <p className="text-sm text-gray-600 mt-1">
              Book an appointment in just a few steps
            </p>
          </div>

          <FormContainer
            apiBaseUrl={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/public`}
            onSuccess={(data) => {
              // Send message to parent window if embedded
              if (window.parent !== window) {
                window.parent.postMessage({
                  type: 'appointment-confirmed',
                  appointmentNumber: data.appointmentNumber,
                  data: data
                }, '*');
              }
            }}
            onError={(error) => {
              console.error('Form submission error:', error);
              // Send error message to parent window if embedded
              if (window.parent !== window) {
                window.parent.postMessage({
                  type: 'appointment-error',
                  error: error.message
                }, '*');
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}