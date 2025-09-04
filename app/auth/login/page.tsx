import { LoginForm } from "@/components/login-form";
import { AuthRedirectHandler } from "@/components/auth-redirect-handler";
import { Smartphone } from "lucide-react";

export default function Page() {
  return (
    <>
      <AuthRedirectHandler />
    <div className="flex min-h-screen w-full">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary/90 items-center justify-center p-12">
        <div className="text-white space-y-6 max-w-md">
          <div className="flex items-center space-x-3">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Smartphone className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">The Phone Guys</h1>
              <p className="text-white/90">CRM System</p>
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">
              Professional Repair Management
            </h2>
            <p className="text-white/80">
              Streamline your repair operations, track customer orders, and manage your business efficiently with our comprehensive CRM system.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="space-y-2">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg font-bold">✓</span>
                </div>
                <p className="text-sm">Track repair orders</p>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg font-bold">✓</span>
                </div>
                <p className="text-sm">Manage customers</p>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg font-bold">✓</span>
                </div>
                <p className="text-sm">Time tracking</p>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg font-bold">✓</span>
                </div>
                <p className="text-sm">Generate reports</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 md:p-10 bg-background">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <Smartphone className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-bold">The Phone Guys</h1>
                <p className="text-muted-foreground text-sm">CRM System</p>
              </div>
            </div>
          </div>
          
          <LoginForm />
          
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 The Phone Guys. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
