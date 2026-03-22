import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "bg-[#f5f5f7] border-0 placeholder:text-[#86868b] text-[#1d1d1f] flex field-sizing-content min-h-16 w-full rounded-xl px-4 py-3 text-base transition-all duration-200 outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:bg-white",
        "dark:bg-[#2c2c2e] dark:text-[#f5f5f7] dark:placeholder:text-[#98989d] dark:focus:bg-[#1c1c1e]",
        "aria-invalid:ring-[#ff3b30]/30 aria-invalid:ring-2",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
