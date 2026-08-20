/** RFC 4180 field escaping — quotes a field only when it contains a comma, quote, or newline, doubling any internal quotes. */
export function csvEscapeField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsv(header: string[], rows: string[][]): string {
  const lines = [header, ...rows].map((row) => row.map(csvEscapeField).join(","));
  return lines.join("\r\n") + "\r\n";
}
