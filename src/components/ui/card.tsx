import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-md border border-border bg-surface p-5",
          hoverable && "transition-colors duration-default hover:bg-surface-hover cursor-pointer",
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";
