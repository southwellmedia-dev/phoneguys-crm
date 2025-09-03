'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: `Password reset email sent to ${email}. Check your inbox!`
      });
      
      // For local development
      if (window.location.hostname === 'localhost') {
        setTimeout(() => {
          setMessage(prev => ({
            ...prev!,
            text: prev!.text + '\n\nFor local testing: Check Inbucket at http://127.0.0.1:54324'
          }));
        }, 1000);
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to send reset email'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleReset}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@phoneguys.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            {message && (
              <div className={`p-3 rounded-md text-sm ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-800' 
                  : 'bg-red-50 text-red-800'
              }`}>
                {message.text.split('\n').map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
                {message.type === 'success' && window.location.hostname === 'localhost' && (
                  <a 
                    href="http://127.0.0.1:54324" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline font-semibold mt-2 inline-block"
                  >
                    Open Inbucket Email Viewer →
                  </a>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Email'}
            </Button>
            <Link href="/auth/login" className="text-sm text-muted-foreground hover:underline">
              Back to login
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}