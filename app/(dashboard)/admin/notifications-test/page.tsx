'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Mail, MessageSquare, Bell, CheckCircle, XCircle } from 'lucide-react';

export default function NotificationsTestPage() {
  const [loading, setLoading] = useState(false);
  const [testType, setTestType] = useState('all');
  const [recipient, setRecipient] = useState('');
  const [testData, setTestData] = useState('{}');
  const [results, setResults] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/test/notifications');
      const data = await response.json();
      if (data.success) {
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  };

  const runTest = async () => {
    setLoading(true);
    setResults(null);

    try {
      let parsedData = {};
      try {
        parsedData = JSON.parse(testData);
      } catch {
        // Invalid JSON, use as-is
      }

      const response = await fetch('/api/test/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: testType,
          to: recipient || undefined,
          testData: parsedData,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Test completed successfully!');
        setResults(data.results);
      } else {
        toast.error(data.error || 'Test failed');
        setResults({ error: data });
      }
    } catch (error) {
      toast.error('Failed to run test');
      console.error('Test error:', error);
      setResults({ error: error });
    } finally {
      setLoading(false);
    }
  };

  // Fetch status on mount
  useState(() => {
    fetchStatus();
  });

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notifications Test Center</h1>
        <p className="text-muted-foreground">Test SendGrid email and Twilio SMS integrations</p>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Service Status
          </CardTitle>
          <CardDescription>Current connection status and configuration</CardDescription>
        </CardHeader>
        <CardContent>
          {status ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-medium">Connections</h3>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {status.currentStatus?.sendGridConnected ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm">SendGrid Email</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {status.currentStatus?.twilioConnected ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm">Twilio SMS</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Environment</h3>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {status.environment?.hasSendGridKey ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm">SendGrid API Key</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {status.environment?.hasTwilioSid && status.environment?.hasTwilioAuth ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm">Twilio Credentials</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading status...</span>
            </div>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchStatus}
            className="mt-4"
          >
            Refresh Status
          </Button>
        </CardContent>
      </Card>

      {/* Test Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Run Tests</CardTitle>
          <CardDescription>Configure and run notification tests</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-type">Test Type</Label>
            <Select value={testType} onValueChange={setTestType}>
              <SelectTrigger id="test-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tests</SelectItem>
                <SelectItem value="sendgrid">SendGrid Direct</SelectItem>
                <SelectItem value="twilio">Twilio Direct</SelectItem>
                <SelectItem value="email">Email Service (Template)</SelectItem>
                <SelectItem value="sms">SMS Service (Template)</SelectItem>
                <SelectItem value="notification">Notification Service (Orchestrated)</SelectItem>
                <SelectItem value="test-connection">Test Connections Only</SelectItem>
                <SelectItem value="stats">Queue Statistics Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipient">
              Recipient (Email or Phone)
              <span className="text-xs text-muted-foreground ml-2">
                Leave empty to use defaults
              </span>
            </Label>
            <Input
              id="recipient"
              placeholder="email@example.com or +1234567890"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-data">
              Test Data (JSON)
              <span className="text-xs text-muted-foreground ml-2">
                Optional custom data for testing
              </span>
            </Label>
            <Textarea
              id="test-data"
              placeholder='{"ticketNumber": "TEST001", "customerName": "John Doe"}'
              value={testData}
              onChange={(e) => setTestData(e.target.value)}
              className="font-mono text-sm"
              rows={4}
            />
          </div>

          <Button 
            onClick={runTest} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Test...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Run Test
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>Output from the test run</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
              {JSON.stringify(results, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Queue Stats */}
      {status?.currentStatus?.emailQueue && (
        <Card>
          <CardHeader>
            <CardTitle>Queue Statistics</CardTitle>
            <CardDescription>Current queue status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Queue
                </h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pending:</span>
                    <span>{status.currentStatus.emailQueue.pending || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Processing:</span>
                    <span>{status.currentStatus.emailQueue.processing || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completed:</span>
                    <span>{status.currentStatus.emailQueue.completed || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Failed:</span>
                    <span>{status.currentStatus.emailQueue.failed || 0}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  SMS Queue
                </h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pending:</span>
                    <span>{status.currentStatus.smsQueue?.pending || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Processing:</span>
                    <span>{status.currentStatus.smsQueue?.processing || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completed:</span>
                    <span>{status.currentStatus.smsQueue?.completed || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Failed:</span>
                    <span>{status.currentStatus.smsQueue?.failed || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}