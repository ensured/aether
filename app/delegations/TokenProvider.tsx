"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Copy, Check, ArrowRight } from "lucide-react";
import Link from "next/link";

interface TokenProviderProps {
  onTokenSubmit: (token: string) => void;
  currentToken?: string;
  isExpired?: boolean;
}

export function TokenProvider({
  onTokenSubmit,
  currentToken,
  isExpired = false,
}: TokenProviderProps) {
  const [token, setToken] = useState(currentToken || "");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    const code = 'copy(JSON.parse(localStorage.getItem("iagon-session")));';
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      // Focus the input field after 2 seconds
      setTimeout(() => {
        const inputElement = document.getElementById("token");
        if (inputElement) {
          inputElement.focus();
        }
      }, 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  // Check if a string is already URI encoded
  const isUriEncoded = (str: string): boolean => {
    try {
      return decodeURIComponent(str) !== str;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    setIsLoading(true);
    try {
      // Check if token is already URI encoded
      const tokenToSubmit = isUriEncoded(token.trim())
        ? token.trim()
        : encodeURIComponent(token.trim());

      console.log("Submitting token:", tokenToSubmit.substring(0, 20) + "...");
      await onTokenSubmit(tokenToSubmit);
      console.log("Token submitted successfully");
    } catch (error) {
      console.error("Failed to submit token:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          {isExpired ? "Update IAGON API Token" : "IAGON API Token"}
        </CardTitle>
        {/* <CardDescription>
         
        </CardDescription> */}
        {isExpired && (
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-linear-to-r from-blue-500/10 to-purple-500/10 rounded-lg blur-xl"></div>
              <div className="relative bg-muted rounded-lg border p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <p className="text-sm font-medium">Token expired</p>
                </div>
                <div className="space-y-3">
                  <Link
                    href="https://dashboard.iagon.com/stake/market/nodes"
                    target="_blank"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="border h-9 w-full font-medium"
                    >
                      Get New Token
                    </Button>
                  </Link>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-current rounded-full"></div>
                      <span>Copy from console</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-current rounded-full"></div>
                      <span>Paste below</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative rounded-lg border bg-zinc-950 shadow-sm overflow-hidden group mt-4">
              <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
                  </div>
                  <span className="ml-2 text-xs font-medium text-zinc-400">
                    Console Command
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyCode}
                  className="h-6 w-6 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
              <div className="p-4 overflow-x-auto">
                <pre className="text-sm font-mono leading-relaxed text-zinc-100">
                  <code>
                    <span className="text-purple-400">copy</span>
                    <span className="text-zinc-500">(</span>
                    <span className="text-blue-400">JSON</span>
                    <span className="text-zinc-500">.</span>
                    <span className="text-yellow-400">parse</span>
                    <span className="text-zinc-500">(</span>
                    <span className="text-blue-400">localStorage</span>
                    <span className="text-zinc-500">.</span>
                    <span className="text-yellow-400">getItem</span>
                    <span className="text-zinc-500">(</span>
                    <span className="text-green-400">"iagon-session"</span>
                    <span className="text-zinc-500">)</span>
                    <span className="text-zinc-500">)</span>
                    <span className="text-zinc-500">);</span>
                  </code>
                </pre>
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token">API Token</Label>
            <Input
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter your IAGON API token"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={!token.trim() || isLoading}
            className="w-full"
          >
            {isLoading
              ? "Loading..."
              : isExpired
                ? "Update Token"
                : "Use Token"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
