"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export function AcceptInvitationForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const verifyInvitation = async () => {
      // Parse URL hash parameters (Supabase uses fragments, not query params)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const access_token = hashParams.get('access_token');
      const refresh_token = hashParams.get('refresh_token');
      const type = hashParams.get('type');
      
      // Also check query params as fallback
      const token_hash = searchParams.get('token_hash');
      const queryType = searchParams.get('type');
      
      // Debug logging
      console.log('Hash params:', Object.fromEntries(hashParams));
      console.log('Query params:', Object.fromEntries(searchParams));
      console.log('access_token:', access_token);
      console.log('type from hash:', type);
      console.log('type from query:', queryType);

      const supabase = createClient();
      
      try {
        // If we have access_token and refresh_token from hash, use session
        if (access_token && refresh_token) {
          console.log('Setting session from tokens');
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token
          });

          if (error) throw error;
          
          if (data.user) {
            console.log('Session set successfully for user:', data.user.email);
            setIsVerifying(false);
            return;
          }
        }
        
        // Fallback: If we have token_hash from query params, use OTP verification
        if (token_hash && queryType === 'invite') {
          console.log('Using OTP verification');
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type: 'invite',
          });

          if (error) throw error;
          
          if (data.user) {
            console.log('OTP verified successfully');
            setIsVerifying(false);
            return;
          }
        }

        // If we get here, we don't have valid tokens
        setError('Invalid invitation link - no valid tokens found');
        setIsVerifying(false);
        
      } catch (error) {
        console.error('Error verifying invitation:', error);
        setError(error instanceof Error ? error.message : 'Failed to verify invitation');
        setIsVerifying(false);
      }
    };

    verifyInvitation();
  }, [searchParams]);

  const handlePasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ 
        password 
      });
      
      if (error) throw error;
      
      // Redirect to dashboard after successful password setup
      router.push('/');
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to set password");
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Verifying Invitation</CardTitle>
            <CardDescription>
              Please wait while we verify your invitation...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center p-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !password) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Invitation Error</CardTitle>
            <CardDescription>
              There was a problem with your invitation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-500 mb-4">{error}</p>
            <Button 
              onClick={() => router.push('/auth/login')} 
              variant="outline"
              className="w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Set Your Password</CardTitle>
          <CardDescription>
            Welcome to The Phone Guys CRM! Please set your password to complete your account setup.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSetup}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your new password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your new password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Setting Password..." : "Complete Setup"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}