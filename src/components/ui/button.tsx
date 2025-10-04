import { ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "success" | "warning" | "error";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", fullWidth = false, children, ...props }, ref) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-2 rounded-xl font-semibold
      transition-smooth focus-visible:outline-ring disabled:opacity-50
      disabled:cursor-not-allowed active:scale-[0.98]
    `;

    const variants = {
      primary: "bg-primary text-primary-foreground hover:opacity-90 shadow-sm hover:shadow-md",
      secondary: "bg-secondary text-secondary-foreground hover:opacity-90 shadow-sm hover:shadow-md",
      outline: "border-2 border-border bg-transparent hover:bg-muted",
      ghost: "bg-transparent hover:bg-muted",
      success: "bg-success text-success-foreground hover:opacity-90 shadow-sm",
      warning: "bg-warning text-warning-foreground hover:opacity-90 shadow-sm",
      error: "bg-error text-error-foreground hover:opacity-90 shadow-sm",
    };

    const sizes = {
      sm: "px-4 py-2 text-sm min-h-[36px]",
      md: "px-6 py-3 text-base min-h-[44px]",
      lg: "px-8 py-4 text-lg min-h-[52px]",
    };

    return (
      <button
        ref={ref}
        className={`
          ${baseStyles}
          ${variants[variant]}
          ${sizes[size]}
          ${fullWidth ? "w-full" : ""}
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
