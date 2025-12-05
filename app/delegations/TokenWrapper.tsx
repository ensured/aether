"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setIagonToken } from "./actions";
import { TokenProvider } from "./TokenProvider";

interface TokenWrapperProps {
  currentToken?: string;
  isExpired?: boolean;
}

export function TokenWrapper({
  currentToken,
  isExpired = false,
}: TokenWrapperProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleTokenSubmit = async (token: string) => {
    console.log(
      "TokenWrapper: handleTokenSubmit called with token length:",
      token.length
    );
    startTransition(async () => {
      try {
        console.log("TokenWrapper: Calling setIagonToken...");
        await setIagonToken(token);
        console.log("TokenWrapper: setIagonToken completed, redirecting...");
        // Use window.location.reload() instead of router.refresh() to force a full page reload
        window.location.reload();
      } catch (error) {
        console.error("Failed to set token:", error);
      }
    });
  };

  return (
    <TokenProvider
      onTokenSubmit={handleTokenSubmit}
      currentToken={currentToken}
      isExpired={isExpired}
    />
  );
}
