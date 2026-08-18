import { InputHTMLAttributes, forwardRef, useId } from "react";
import styles from "./Field.module.css";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, required, id, className, ...rest }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className={styles.field}>
        {label ? (
          <div className={styles.labelRow}>
            <label htmlFor={inputId} className={styles.label}>
              {label}
            </label>
            {required ? <span className={styles.required} aria-hidden="true" /> : null}
          </div>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-required={required || undefined}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
          className={["input", error ? styles.inputError : "", className]
            .filter(Boolean)
            .join(" ")}
          {...rest}
        />
        {hint && !error ? (
          <span id={hintId} className={styles.hint}>
            {hint}
          </span>
        ) : null}
        {error ? (
          <span id={errorId} className={styles.error} role="alert">
            {error}
          </span>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";
