import { InputHTMLAttributes, forwardRef, useId } from "react";
import styles from "./Choice.module.css";

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, id, className, ...rest }, ref) => {
    const generatedId = useId();
    const checkboxId = id ?? generatedId;

    return (
      <label htmlFor={checkboxId} className={styles.option}>
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          className={[styles.input, className].filter(Boolean).join(" ")}
          {...rest}
        />
        {label}
      </label>
    );
  },
);

Checkbox.displayName = "Checkbox";
