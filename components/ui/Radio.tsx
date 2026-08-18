import { InputHTMLAttributes, forwardRef, useId } from "react";
import styles from "./Choice.module.css";

export interface RadioProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, id, className, ...rest }, ref) => {
    const generatedId = useId();
    const radioId = id ?? generatedId;

    return (
      <label htmlFor={radioId} className={styles.option}>
        <input
          ref={ref}
          id={radioId}
          type="radio"
          className={[styles.input, className].filter(Boolean).join(" ")}
          {...rest}
        />
        {label}
      </label>
    );
  },
);

Radio.displayName = "Radio";
