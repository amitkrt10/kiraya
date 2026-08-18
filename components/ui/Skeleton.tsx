import { CSSProperties } from "react";

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Skeleton({ width = "100%", height = 14, className }: SkeletonProps) {
  const style: CSSProperties = { width, height };
  return (
    <span
      className={["skeleton", className].filter(Boolean).join(" ")}
      style={style}
      aria-hidden="true"
    />
  );
}

export function SkeletonTableRows({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <td key={columnIndex}>
              <Skeleton />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
