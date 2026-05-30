export function escapeCsvValue(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);
  if (/[,"\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

export function buildCsv(
  headers: string[],
  rows: Array<Array<string | number | boolean | null | undefined>>,
) {
  const output = [headers, ...rows]
    .map((row) => row.map((cell) => escapeCsvValue(cell)).join(","))
    .join("\r\n");

  return `\uFEFF${output}`;
}
