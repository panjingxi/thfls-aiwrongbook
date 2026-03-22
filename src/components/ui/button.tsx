import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-[#0071e3]/30 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default: "bg-[#0071e3] text-white hover:bg-[#0077ed] shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
        destructive:
          "bg-[#ff3b30] text-white hover:bg-[#ff453a] shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
        outline:
          "border border-[#d2d2d7] bg-white text-[#1d1d1f] hover:bg-[#f5f5f7] shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:bg-[#1c1c1e] dark:border-[rgba(255,255,255,0.1)] dark:text-[#f5f5f7] dark:hover:bg-[#2c2c2e]",
        secondary:
          "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed] dark:bg-[#2c2c2e] dark:text-[#f5f5f7] dark:hover:bg-[#3a3a3c]",
        ghost:
          "text-[#1d1d1f] hover:bg-[#f5f5f7] dark:text-[#f5f5f7] dark:hover:bg-[#2c2c2e]",
        link: "text-[#0071e3] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-5 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-full gap-1.5 px-4 has-[>svg]:px-2.5 text-xs",
        lg: "h-11 rounded-full px-6 has-[>svg]:px-4",
        icon: "size-9 rounded-full",
        "icon-sm": "size-8 rounded-full",
        "icon-lg": "size-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
