import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Return a simple HTML page with real-time debugging
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Real-time Debug</title>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body>
  <h1>Supabase Real-time Debug</h1>
  <div id="status">Initializing...</div>
  <div id="messages"></div>
  
  <script>
    const { createClient } = supabase;
    
    // Use the same credentials from your .env.local
    const supabaseUrl = 'https://egotypldqzdzjclikmeg.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnb3R5cGxkcXpkempjbGlrbWVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MDMzNzEsImV4cCI6MjA3MjQ3OTM3MX0.FKiAul89-8YgRoZG3td5sNPAySAq0dVkT5nYfcqgQKc';
    
    const client = createClient(supabaseUrl, supabaseKey);
    
    async function init() {
      const status = document.getElementById('status');
      const messages = document.getElementById('messages');
      
      // Get current user
      const { data: { user } } = await client.auth.getUser();
      
      if (!user) {
        status.innerHTML = '<p style="color: red;">Not authenticated. Please log in first.</p>';
        return;
      }
      
      status.innerHTML = '<p>User: ' + user.email + ' (ID: ' + user.id + ')</p>';
      
      // Test 1: Subscribe without filter
      const channel1 = client.channel('test-all-notifications')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'internal_notifications'
        }, (payload) => {
          console.log('Received (no filter):', payload);
          messages.innerHTML += '<p style="color: green;">✓ Received event (no filter): ' + payload.eventType + ' - ' + JSON.stringify(payload.new || payload.old) + '</p>';
        })
        .subscribe((status, error) => {
          if (error) {
            messages.innerHTML += '<p style="color: red;">❌ Subscription error (no filter): ' + error.message + '</p>';
          } else {
            messages.innerHTML += '<p>Subscription status (no filter): ' + status + '</p>';
          }
        });
      
      // Test 2: Subscribe with user filter
      const channel2 = client.channel('test-user-notifications')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'internal_notifications',
          filter: 'user_id=eq.' + user.id
        }, (payload) => {
          console.log('Received (with filter):', payload);
          messages.innerHTML += '<p style="color: blue;">✓ Received event (with filter): ' + payload.eventType + ' - ' + JSON.stringify(payload.new || payload.old) + '</p>';
        })
        .subscribe((status, error) => {
          if (error) {
            messages.innerHTML += '<p style="color: red;">❌ Subscription error (with filter): ' + error.message + '</p>';
          } else {
            messages.innerHTML += '<p>Subscription status (with filter): ' + status + '</p>';
          }
        });
      
      // Clean up on page unload
      window.addEventListener('beforeunload', () => {
        client.removeChannel(channel1);
        client.removeChannel(channel2);
      });
    }
    
    init();
  </script>
</body>
</html>
  `;
  
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}