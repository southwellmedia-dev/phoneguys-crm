const fs = require('fs');

async function testTimerStop() {
  try {
    // Get cookies from the file if available
    let cookie = '';
    try {
      cookie = fs.readFileSync('cookies.txt', 'utf8').trim();
    } catch (e) {
      console.log('No cookies file found, might fail authentication');
    }

    const ticketId = '00000002-0000-0000-0000-000000000002';
    const url = `http://localhost:3000/api/orders/${ticketId}/timer`;
    
    console.log('Testing timer stop at:', url);
    console.log('Using cookie:', cookie ? 'Yes' : 'No');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie
      },
      body: JSON.stringify({
        action: 'stop',
        notes: 'Test stop from script'
      })
    });

    console.log('Response status:', response.status);
    
    const text = await response.text();
    console.log('Response body:', text);
    
    try {
      const data = JSON.parse(text);
      console.log('Parsed response:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('Could not parse as JSON');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testTimerStop();