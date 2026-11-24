import { formatTable } from "./table.ts"

describe("formatTable", () => {
  test("pads every column to its widest cell", () => {
    expect(
      formatTable(
        ["case", "ms"],
        [
          ["a", "1.5"],
          ["longer", "10.25"],
        ]
      )
    ).toBe(["| case   | ms    |", "|--------|-------|", "| a      | 1.5   |", "| longer | 10.25 |"].join("\n"))
  })

  test("right-aligns the columns it is told to, and marks them so in the rule", () => {
    expect(
      formatTable(
        ["case", "ms"],
        [
          ["a", "1.5"],
          ["b", "10.25"],
        ],
        ["left", "right"]
      )
    ).toBe(["| case |    ms |", "|------|------:|", "| a    |   1.5 |", "| b    | 10.25 |"].join("\n"))
  })

  test("leaves a missing cell blank instead of breaking the row", () => {
    expect(formatTable(["a", "b"], [["x"]])).toBe(["| a | b |", "|---|---|", "| x |   |"].join("\n"))
  })
})
