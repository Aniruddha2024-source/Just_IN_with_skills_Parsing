import React from "react";
import { cn } from "@/lib/utils";

const WrapButton = React.forwardRef(({ 
  className, 
  children, 
  variant = "default", 
  size = "default",
  leftIcon,
  rightIcon,
  ...props 
}, ref) => {
  const variantStyles = {
    default: "bg-black text-white hover:bg-gray-800",
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    destructive: "bg-red-500 text-white hover:bg-red-600",
    success: "bg-green-500 text-white hover:bg-green-600",
    outline: "border border-gray-200 bg-transparent hover:bg-gray-100",
    ghost: "bg-transparent hover:bg-gray-100"
  };

  const sizeStyles = {
    sm: "text-sm px-3 py-1.5 h-8",
    default: "text-base px-4 py-2 h-10",
    lg: "text-lg px-6 py-3 h-12",
    icon: "h-10 w-10"
  };

  return (
    <button
      ref={ref}
      className={cn(
        "flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
});

WrapButton.displayName = "WrapButton";

export { WrapButton };
