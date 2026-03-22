import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-[#86868b] selection:bg-[#0071e3]/20 selection:text-[#1d1d1f] bg-[#f5f5f7] border-0 h-10 w-full min-w-0 rounded-xl px-4 py-2 text-base text-[#1d1d1f] transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:bg-white",
        "dark:bg-[#2c2c2e] dark:text-[#f5f5f7] dark:placeholder:text-[#98989d] dark:focus:bg-[#1c1c1e]",
        "aria-invalid:ring-[#ff3b30]/30 aria-invalid:ring-2",
        className
      )}
      {...props}
    />
  )
}

export { Input }
