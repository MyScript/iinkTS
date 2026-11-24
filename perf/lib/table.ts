export type TAlign = "left" | "right"

/**
 * A Markdown table, padded so it also reads as a table in a plain console log — the Jenkins one in
 * particular, where the gate's verdict is read.
 *
 * Columns default to left-aligned; numbers read better right-aligned, so the caller says which.
 */
export function formatTable(header: string[], rows: string[][], align: TAlign[] = []): string {
  const widths = header.map((title, col) => Math.max(title.length, ...rows.map((row) => (row[col] ?? "").length)))
  const cell = (text: string, col: number): string =>
    align[col] === "right" ? text.padStart(widths[col]) : text.padEnd(widths[col])
  const line = (cells: string[]): string => `| ${widths.map((_, col) => cell(cells[col] ?? "", col)).join(" | ")} |`
  const rule = `|${widths.map((w, col) => (align[col] === "right" ? `${"-".repeat(w + 1)}:` : "-".repeat(w + 2))).join("|")}|`
  return [line(header), rule, ...rows.map(line)].join("\n")
}
