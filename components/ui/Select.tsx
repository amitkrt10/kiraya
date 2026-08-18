import { SelectHTMLAttributes, forwardRef, useId } from "react";
import styles from "./Field.module.css";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, hint, error, required, id, className, options, placeholder, ...rest },
    ref,
  ) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const hintId = hint ? `${selectId}-hint` : undefined;
    const errorId = error ? `${selectId}-error` : undefined;

    return (
      <div className={styles.field}>
        {label ? (
          <div className={styles.labelRow}>
            <label htmlFor={selectId} className={styles.label}>
              {label}
            </label>
            {required ? <span className={styles.required} aria-hidden="true" /> : null}
          </div>
        ) : null}
        <select
          ref={ref}
          id={selectId}
          required={required}
          aria-required={required || undefined}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
          className={["input", error ? styles.inputError : "", className]
            .filter(Boolean)
            .join(" ")}
          {...rest}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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

Select.displayName = "Select";
