"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "tertiary";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: "action-sm px-3 py-1.5",
  md: "action-md px-4 py-2",
  lg: "action-lg px-5 py-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, children, style, ...props }, ref) => {
    const variantStyle: React.CSSProperties =
      variant === "primary"
        ? {
            background: "var(--brand-600)",
            color: "var(--text-inverse)",
            borderRadius: "var(--radius-sm)",
          }
        : variant === "secondary"
        ? {
            background: "transparent",
            color: "var(--brand-600)",
            border: "1px solid var(--outline-primary)",
            borderRadius: "var(--radius-sm)",
          }
        : {
            background: "transparent",
            color: "var(--brand-600)",
            borderRadius: "var(--radius-sm)",
          };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 transition-opacity hover:opacity-80 disabled:opacity-40",
          sizeClasses[size],
          className,
        )}
        style={{ ...variantStyle, ...style }}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
