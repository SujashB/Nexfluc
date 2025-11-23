"use client";
import React from "react";
import { cn } from "@/lib/utils";


export const FloatingNav = ({
  className,
}: {
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "flex w-full max-w-4xl fixed top-10 left-1/2 -translate-x-1/2 border border-stone-700/50 rounded-full bg-stone-900/90 backdrop-blur-xl shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.3),0px_1px_0px_0px_rgba(0,0,0,0.1),0px_0px_0px_1px_rgba(0,0,0,0.2)] z-[5000] px-8 py-3 items-center justify-start",
        className
      )}
    >
      <span className="text-xl font-semibold text-stone-200">Nexfluc</span>
    </div>
  );
}
