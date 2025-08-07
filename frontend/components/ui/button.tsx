import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5" + 
                 " bg-[rgb(98,181,229)] hover:bg-[rgb(78,145,183)]",
        destructive: "bg-red-500 text-white shadow-sm hover:bg-red-600",
        outline: "border-2 border-[rgb(98,181,229)] bg-white shadow-sm hover:bg-[rgb(98,181,229)] hover:text-white",
        secondary: "bg-white text-[rgb(98,181,229)] shadow-md hover:shadow-lg border border-gray-200",
        ghost: "hover:bg-[rgb(98,181,229)]/10 hover:text-[rgb(98,181,229)]",
        link: "text-[rgb(98,181,229)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }