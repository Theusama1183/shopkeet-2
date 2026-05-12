import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost"
  size?: "sm" | "md" | "lg"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          // base
          "inline-flex items-center justify-center rounded-md font-semibold transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
          "disabled:pointer-events-none disabled:opacity-50",

          // variants
          variant === "primary" &&
            "bg-violet-500 text-white hover:bg-violet-600",
          variant === "outline" &&
            "border border-slate-200 bg-white text-zinc-900 hover:bg-zinc-100",
          variant === "ghost" &&
            "text-zinc-900 hover:bg-zinc-100",

          // sizes
          size === "sm" && "h-9 px-3 text-sm",
          size === "md" && "h-12 px-4 py-3",
          size === "lg" && "h-14 px-6 text-lg",

          className
        )}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"

export { Button }
