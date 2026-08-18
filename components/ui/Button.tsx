import { ButtonHTMLAttributes, forwardRef } from "react";
import { LoaderCircle } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: "btn btn-primary",
  secondary: "btn btn-secondary",
  danger: "btn btn-danger",
  icon: "btn btn-icon",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "secondary", loading = false, disabled, className, children, ...rest },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={[variantClass[variant], className].filter(Boolean).join(" ")}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...rest}
      >
        {loading ? (
          <LoaderCircle className="lucide-spin" width={16} height={16} aria-hidden="true" />
        ) : null}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
