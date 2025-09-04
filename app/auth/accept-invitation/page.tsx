import { AcceptInvitationForm } from "@/components/accept-invitation-form";

export default function AcceptInvitationPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <AcceptInvitationForm />
      </div>
    </div>
  );
}