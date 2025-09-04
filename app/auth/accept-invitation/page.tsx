import { AcceptInvitationForm } from "@/components/accept-invitation-form";
import { Suspense } from "react";

function AcceptInvitationLoading() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="text-2xl font-semibold leading-none tracking-tight">Loading...</h3>
              <p className="text-sm text-muted-foreground">
                Please wait while we load your invitation.
              </p>
            </div>
            <div className="p-6 pt-0">
              <div className="flex justify-center p-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense fallback={<AcceptInvitationLoading />}>
          <AcceptInvitationForm />
        </Suspense>
      </div>
    </div>
  );
}