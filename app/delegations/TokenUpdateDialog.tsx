"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { setIagonToken, getToken } from "./actions";
import { useRouter } from "next/navigation";
import { useTokenExpiration } from "./useTokenExpiration";

export function TokenUpdateDialog() {
  const [token, setToken] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { isTokenExpired, resetTokenExpiration } = useTokenExpiration();

  // Check if a string is already URI encoded
  const isUriEncoded = (str: string): boolean => {
    try {
      return decodeURIComponent(str) !== str;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    getToken().then((token) => setToken(token || ""));
  }, []);

  // Auto-open dialog when token expires
  useEffect(() => {
    if (isTokenExpired) {
      setIsOpen(true);
    }
  }, [isTokenExpired]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsLoading(true);
    try {
      // Check if token is already URI encoded
      const tokenToSet = isUriEncoded(token)
        ? token
        : encodeURIComponent(token);
      await setIagonToken(tokenToSet);
      setIsOpen(false);
      resetTokenExpiration(); // Reset expiration flag
      router.refresh(); // Refresh the page to fetch data with new token
    } catch (error) {
      console.error("Failed to update token:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    setIsLoading(true);
    try {
      // Clear the token cookie by setting it to expire immediately
      document.cookie =
        "iagon_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      setToken("");
      await setIagonToken("");
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to clear token:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Update Token
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isTokenExpired
              ? "Token Expired - Update IAGON API Token"
              : "Update IAGON API Token"}
          </DialogTitle>
          <DialogDescription>
            {isTokenExpired
              ? "Your API token has expireds. Please update your token to continue viewing your delegation data."
              : "Update your IAGON API token to fetch delegation data"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token">Current Token</Label>
            <Input
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter your IAGON API token"
              required
            />

            <p className="text-xs text-muted-foreground">
              Your token is stored securely in HTTP-only cookies
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={!token.trim() || isLoading}
              className="flex-1"
            >
              {isLoading
                ? "Updating..."
                : isTokenExpired
                ? "Update Expired Token"
                : "Update Token"}
            </Button>
            <Button
              type="button"
              onClick={handleClear}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              Clear Token
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
