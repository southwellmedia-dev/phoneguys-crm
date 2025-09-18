#!/bin/bash
# Test script for notification flow
# This script tests the complete notification lifecycle from appointment to ticket completion

# Configuration
BASE_URL="http://localhost:3000"
API_URL="${BASE_URL}/api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test user credentials (use existing admin user from seed data)
ADMIN_EMAIL="admin@phoneguys.com"
ADMIN_PASSWORD="admin123456"

# Customer info for testing
CUSTOMER_EMAIL="test.customer@example.com"
CUSTOMER_PHONE="+15551234567"  # Use a valid phone format for Twilio

# Variables to store IDs across tests
AUTH_TOKEN=""
APPOINTMENT_ID=""
TICKET_ID=""

echo -e "${YELLOW}=== Phone Guys CRM - Notification Flow Test ===${NC}\n"

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
    fi
}

# Function to extract JSON value
extract_json_value() {
    echo "$1" | grep -o "\"$2\":\"[^\"]*" | grep -o "[^\"]*$"
}

# Step 1: Login to get auth token
echo -e "${YELLOW}Step 1: Authenticating as admin...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST \
    "${BASE_URL}/auth/api/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}" \
    -c cookies.txt)

if [[ $LOGIN_RESPONSE == *"success"* ]]; then
    print_result 0 "Authentication successful"
    # Extract cookies for subsequent requests
    echo "Using session cookies for authentication"
else
    print_result 1 "Authentication failed"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

# Step 2: Create an appointment (simulating form submission)
echo -e "\n${YELLOW}Step 2: Creating appointment (form submission)...${NC}"
APPOINTMENT_DATA=$(cat <<EOF
{
  "customer": {
    "name": "Test Customer",
    "email": "${CUSTOMER_EMAIL}",
    "phone": "${CUSTOMER_PHONE}"
  },
  "appointment": {
    "service_type": "screen_replacement",
    "device_brand": "Apple",
    "device_model": "iPhone 14 Pro",
    "appointment_date": "$(date -u -d '+2 days' '+%Y-%m-%dT%H:%M:%S.000Z')",
    "appointment_time": "10:00",
    "description": "Cracked screen needs replacement",
    "estimated_duration": 60
  }
}
EOF
)

APPOINTMENT_RESPONSE=$(curl -s -X POST \
    "${API_URL}/appointments/submit" \
    -H "Content-Type: application/json" \
    -d "$APPOINTMENT_DATA")

if [[ $APPOINTMENT_RESPONSE == *"appointment_id"* ]]; then
    APPOINTMENT_ID=$(echo "$APPOINTMENT_RESPONSE" | grep -o '"appointment_id":"[^"]*' | cut -d'"' -f4)
    print_result 0 "Appointment created: $APPOINTMENT_ID"
    echo -e "${GREEN}→ Customer should receive confirmation email/SMS${NC}"
else
    print_result 1 "Failed to create appointment"
    echo "Response: $APPOINTMENT_RESPONSE"
fi

# Wait for notification to be sent
sleep 2

# Step 3: Confirm the appointment
echo -e "\n${YELLOW}Step 3: Confirming appointment...${NC}"
CONFIRM_RESPONSE=$(curl -s -X PATCH \
    "${API_URL}/appointments/${APPOINTMENT_ID}/confirm" \
    -H "Content-Type: application/json" \
    -b cookies.txt)

if [[ $CONFIRM_RESPONSE == *"success"* ]]; then
    print_result 0 "Appointment confirmed"
    echo -e "${GREEN}→ Customer should receive confirmation email/SMS${NC}"
else
    print_result 1 "Failed to confirm appointment"
    echo "Response: $CONFIRM_RESPONSE"
fi

# Wait for notification to be sent
sleep 2

# Step 4: Convert appointment to ticket
echo -e "\n${YELLOW}Step 4: Converting appointment to repair ticket...${NC}"
CONVERT_RESPONSE=$(curl -s -X POST \
    "${API_URL}/appointments/${APPOINTMENT_ID}/convert" \
    -H "Content-Type: application/json" \
    -b cookies.txt \
    -d '{
        "repair_issues": ["Screen Replacement"],
        "estimated_cost": 199.99,
        "priority": "high",
        "notes": "Customer dropped phone, screen is cracked"
    }')

if [[ $CONVERT_RESPONSE == *"ticketId"* ]] || [[ $CONVERT_RESPONSE == *"ticket_id"* ]]; then
    TICKET_ID=$(echo "$CONVERT_RESPONSE" | grep -o '"ticket[_]*[Ii]d":"[^"]*' | cut -d'"' -f4)
    print_result 0 "Converted to ticket: $TICKET_ID"
    echo -e "${GREEN}→ Customer should receive ticket creation email/SMS${NC}"
else
    print_result 1 "Failed to convert to ticket"
    echo "Response: $CONVERT_RESPONSE"
    # Try to extract ticket_id from error response
    if [[ $CONVERT_RESPONSE == *"already converted"* ]]; then
        echo "Appointment was already converted. Fetching ticket ID..."
        # Get ticket ID from appointment
        TICKET_FETCH=$(curl -s -X GET \
            "${API_URL}/appointments/${APPOINTMENT_ID}" \
            -b cookies.txt)
        TICKET_ID=$(echo "$TICKET_FETCH" | grep -o '"ticket_id":"[^"]*' | cut -d'"' -f4)
        if [ ! -z "$TICKET_ID" ]; then
            echo "Found existing ticket: $TICKET_ID"
        fi
    fi
fi

# Wait for notification to be sent
sleep 2

# Step 5: Start timer (changes status to in_progress)
echo -e "\n${YELLOW}Step 5: Starting timer (status → in_progress)...${NC}"
TIMER_RESPONSE=$(curl -s -X POST \
    "${API_URL}/orders/${TICKET_ID}/timer" \
    -H "Content-Type: application/json" \
    -b cookies.txt \
    -d '{"action": "start"}')

if [[ $TIMER_RESPONSE == *"success"* ]]; then
    print_result 0 "Timer started - Status changed to 'in_progress'"
    echo -e "${GREEN}→ Customer should receive 'work started' email/SMS${NC}"
else
    print_result 1 "Failed to start timer"
    echo "Response: $TIMER_RESPONSE"
fi

# Wait for work to be "done"
sleep 3

# Step 6: Stop timer
echo -e "\n${YELLOW}Step 6: Stopping timer...${NC}"
STOP_TIMER_RESPONSE=$(curl -s -X POST \
    "${API_URL}/orders/${TICKET_ID}/timer" \
    -H "Content-Type: application/json" \
    -b cookies.txt \
    -d '{"action": "stop", "notes": "Screen replacement completed successfully"}')

if [[ $STOP_TIMER_RESPONSE == *"success"* ]]; then
    print_result 0 "Timer stopped"
else
    print_result 1 "Failed to stop timer"
    echo "Response: $STOP_TIMER_RESPONSE"
fi

# Step 7: Mark ticket as completed
echo -e "\n${YELLOW}Step 7: Marking ticket as completed...${NC}"
COMPLETE_RESPONSE=$(curl -s -X PATCH \
    "${API_URL}/orders/${TICKET_ID}/status" \
    -H "Content-Type: application/json" \
    -b cookies.txt \
    -d '{"status": "completed", "reason": "Repair completed successfully"}')

if [[ $COMPLETE_RESPONSE == *"success"* ]]; then
    print_result 0 "Ticket marked as completed"
    echo -e "${GREEN}→ Customer should receive 'ready for pickup' email/SMS${NC}"
else
    print_result 1 "Failed to complete ticket"
    echo "Response: $COMPLETE_RESPONSE"
fi

# Step 8: Check notification logs (if available)
echo -e "\n${YELLOW}Step 8: Checking notification status...${NC}"
echo "Checking Supabase logs for notification activity..."

# Query the notifications table to see what was sent
NOTIFICATIONS_CHECK=$(curl -s -X GET \
    "${API_URL}/admin/notifications?ticket_id=${TICKET_ID}" \
    -b cookies.txt)

if [[ $NOTIFICATIONS_CHECK == *"email"* ]] || [[ $NOTIFICATIONS_CHECK == *"sms"* ]]; then
    echo -e "${GREEN}Notifications found in database${NC}"
    echo "$NOTIFICATIONS_CHECK" | python3 -m json.tool 2>/dev/null || echo "$NOTIFICATIONS_CHECK"
else
    echo "No notification records found (this might be normal if using external services)"
fi

# Cleanup
rm -f cookies.txt

echo -e "\n${YELLOW}=== Test Summary ===${NC}"
echo "Appointment ID: $APPOINTMENT_ID"
echo "Ticket ID: $TICKET_ID"
echo "Customer Email: $CUSTOMER_EMAIL"
echo "Customer Phone: $CUSTOMER_PHONE"
echo -e "\n${GREEN}Expected Notifications:${NC}"
echo "1. ✉️ Appointment submission confirmation"
echo "2. ✉️ Appointment confirmation"
echo "3. ✉️ Ticket created from appointment"
echo "4. ✉️ Work started (in_progress)"
echo "5. ✉️ Repair completed (ready for pickup)"

echo -e "\n${YELLOW}Note:${NC} Check your email provider (SendGrid) and SMS provider (Twilio) dashboards"
echo "to confirm notifications were actually sent."
echo ""
echo "Also check Supabase Inbucket for local development:"
echo "http://127.0.0.1:54324"