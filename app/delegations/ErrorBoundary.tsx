"use client";

import { useEffect, useState } from "react";
import { TokenWrapper } from "./TokenWrapper";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Caught error:", event.error);
      const errorMessage = event.error?.message || "";
      if (errorMessage.includes("401")) {
        setHasError(true);
        setError(event.error);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);
      const errorMessage = event.reason?.message || "";
      if (errorMessage.includes("401")) {
        setHasError(true);
        setError(new Error(event.reason));
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
    };
  }, []);

  if (hasError && error?.message.includes("401")) {
    return (
      <main className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Token Expired</h1>
          <p className="text-muted-foreground mb-6">
            Your API token has expired. Please update your token to continue
            viewing your delegation data.
          </p>
          <TokenWrapper isExpired={true} />
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
