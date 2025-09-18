import { Suspense } from "react";
import { LoginFormClient } from "./login-form-client";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <Suspense fallback={
      <div className="flex flex-col gap-6">
        <div className="h-[400px] animate-pulse bg-muted rounded-lg" />
      </div>
    }>
      <LoginFormClient className={className} {...props} />
    </Suspense>
  );
}