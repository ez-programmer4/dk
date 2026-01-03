"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({
  size = "md",
  className,
  text,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  const content = (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <Loader2
        className={cn(
          "animate-spin text-indigo-600",
          sizeClasses[size]
        )}
      />
      {text && (
        <p className="mt-4 text-sm font-medium text-gray-600 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
}

export function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/20 to-indigo-50/20">
      <LoadingSpinner size="xl" text="Loading..." />
    </div>
  );
}

export function InlineLoading({ text }: { text?: string }) {
  return <LoadingSpinner size="md" text={text} />;
}
