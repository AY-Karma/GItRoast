import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("glass rounded-3xl p-6 text-white", className)}
      {...props}
    />
  );
}
