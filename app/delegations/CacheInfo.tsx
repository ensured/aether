"use client";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";

interface CacheInfoProps {
  cacheTime: number;
  revalidateSeconds: number;
}

export function CacheInfo({ cacheTime, revalidateSeconds }: CacheInfoProps) {
  const [timeUntilRefresh, setTimeUntilRefresh] = useState(revalidateSeconds);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial calculation
    const elapsed = Math.floor((Date.now() - cacheTime) / 1000);
    const remaining = Math.max(0, revalidateSeconds - elapsed);
    setTimeUntilRefresh(remaining);
    setIsLoading(false);

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - cacheTime) / 1000);
      const remaining = Math.max(0, revalidateSeconds - elapsed);
      setTimeUntilRefresh(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [cacheTime, revalidateSeconds]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const lastUpdated = new Date(cacheTime);
  const cacheProgress =
    ((revalidateSeconds - timeUntilRefresh) / revalidateSeconds) * 100;

  // Skeleton loading state
  if (isLoading) {
    return (
      <div
        className="text-sm text-muted-foreground max-w-sm flex flex-col 
    items-center justify-center w-full p-4"
      >
        <div className="flex items-center gap-4 w-full min-h-[20px]">
          <div className="flex flex-col w-full">
            <div className="h-4">
              <span className="invisible">Last Updated: Loading...</span>
            </div>
            <div className="h-4 mt-1">
              <span className="invisible">
                Next Cache Invalidation: Loading...
              </span>
            </div>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
          <div className="bg-gray-300 dark:bg-gray-600 h-2 rounded-full animate-pulse w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="text-sm text-muted-foreground max-w-sm flex flex-col 
    items-center justify-center w-full p-4"
    >
      <div className="flex items-center gap-4 w-full min-h-[20px]">
        <div className="flex flex-col w-full">
          <div className="h-4">
            <span>
              Last Updated:{" "}
              {formatDistanceToNow(lastUpdated, { addSuffix: true })}
            </span>
          </div>
          <div className="h-4 mt-1">
            <span>Next Cache Invalidation: {formatTime(timeUntilRefresh)}</span>
          </div>
        </div>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
          style={{ width: `${cacheProgress}%` }}
        />
      </div>
    </div>
  );
}
