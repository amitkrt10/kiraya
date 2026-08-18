import { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import styles from "./Table.module.css";

export function Table({ className, children, ...rest }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className={styles.wrapper}>
      <table className={["table", styles.table, className].filter(Boolean).join(" ")} {...rest}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead {...rest}>{children}</thead>;
}

export function TableBody({ children, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...rest}>{children}</tbody>;
}

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  clickable?: boolean;
}

export function TableRow({ clickable, className, children, ...rest }: TableRowProps) {
  return (
    <tr
      className={[clickable ? styles.clickableRow : "", className].filter(Boolean).join(" ")}
      tabIndex={clickable ? 0 : undefined}
      {...rest}
    >
      {children}
    </tr>
  );
}

export function TableHeaderCell({
  className,
  scope = "col",
  children,
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th scope={scope} className={className} {...rest}>
      {children}
    </th>
  );
}

export interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  numeric?: boolean;
}

export function TableCell({ numeric, className, children, ...rest }: TableCellProps) {
  return (
    <td className={[numeric ? "num" : "", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </td>
  );
}
