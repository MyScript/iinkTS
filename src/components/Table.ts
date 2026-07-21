/**
 * @group Components
 */
export type TTableColumn = {
  header: string | HTMLElement
  align?: "left" | "center" | "right"
  width?: string
}

/**
 * @group Components
 */
export type TTableCellConfig = {
  content: string | HTMLElement
  align?: "left" | "center" | "right"
  style?: string
}

/**
 * @group Components
 */
export type TTableRow = {
  cells: (string | HTMLElement | TTableCellConfig)[]
  style?: string
  hoverStyle?: string
  data?: unknown
}

/**
 * @group Components
 */
export type TTableConfig = {
  columns: (string | TTableColumn)[]
  rows: TTableRow[]
  stickyHeader?: boolean
  hoverEffect?: boolean
  fontSize?: string
  maxHeight?: string
  width?: string
  selectable?: boolean
  multiSelect?: boolean
  onRowClick?: (rowIndex: number, rowData?: unknown, isSelected?: boolean) => void
}

import { DOMFactory } from "@/components/dom"

/**
 * @group Components
 * @remarks Generic table component for displaying data in a structured format
 */
export class Table {
  private table: HTMLTableElement
  private config: TTableConfig
  private rowElements: Map<number, HTMLTableRowElement> = new Map()
  private selectedRows: Set<number> = new Set()

  constructor(config: TTableConfig) {
    this.config = {
      stickyHeader: true,
      hoverEffect: true,
      fontSize: "14px",
      width: "100%",
      selectable: false,
      multiSelect: false,
      ...config,
    }
    this.table = this.createTable()
  }

  private createTable(): HTMLTableElement {
    const table = DOMFactory.table({
      className: "ms-table",
    })
    table.style.width = this.config.width!
    table.style.fontSize = this.config.fontSize!
    if (this.config.maxHeight) {
      table.style.maxHeight = this.config.maxHeight
      table.style.overflowY = "auto"
      table.style.display = "block"
    }

    // Create header
    const thead = this.createHeader()
    table.appendChild(thead)

    // Create body
    const tbody = this.createBody()
    table.appendChild(tbody)

    return table
  }

  private createHeader(): HTMLTableSectionElement {
    const thead = DOMFactory.thead()

    if (this.config.stickyHeader) {
      thead.style.cssText = "position: sticky; top: 0; background: var(--ms-ink-canvas-bg); font-weight: bold;"
    }

    const headerRow = DOMFactory.tr({
      className: "ms-table-header-row",
    })

    this.config.columns.forEach((column) => {
      let th: HTMLTableCellElement

      if (typeof column === "string") {
        th = DOMFactory.th({
          className: "ms-table-th",
          style: "text-align: left;",
          text: column,
        })
      } else {
        th = DOMFactory.th({
          className: "ms-table-th",
          style: `text-align: ${column.align || "left"};`,
        })

        // Handle both string and HTMLElement headers
        if (typeof column.header === "string") {
          th.textContent = column.header
        } else {
          th.appendChild(column.header)
        }

        if (column.width) {
          th.style.width = column.width
        }
      }

      headerRow.appendChild(th)
    })

    thead.appendChild(headerRow)
    return thead
  }

  private createBody(): HTMLTableSectionElement {
    const tbody = DOMFactory.tbody()
    this.rowElements.clear()

    this.config.rows.forEach((rowConfig, rowIndex) => {
      const baseStyle = rowConfig.style || "border-bottom: 1px solid var(--ms-ink-surface);"
      const row = DOMFactory.tr({
        style: baseStyle,
      })

      // Store row element reference
      this.rowElements.set(rowIndex, row)

      // Add selectable cursor
      if (this.config.selectable) {
        row.style.cursor = "pointer"
      }

      // Add hover effect if enabled
      if (this.config.hoverEffect) {
        const hoverStyle = rowConfig.hoverStyle || "var(--ms-ink-menu-hover)"
        row.addEventListener("pointerenter", () => {
          if (!this.selectedRows.has(rowIndex)) {
            row.style.background = hoverStyle
          }
        })
        row.addEventListener("pointerleave", () => {
          if (!this.selectedRows.has(rowIndex)) {
            row.style.cssText = baseStyle
          }
        })
      }

      // Add click handler for selectable rows
      if (this.config.selectable) {
        row.addEventListener("pointerup", (event) => {
          this.handleRowClick(rowIndex, rowConfig.data, event)
        })
      }

      // Create cells
      rowConfig.cells.forEach((cellData, index) => {
        // Get column alignment
        const column = this.config.columns[index]
        const columnAlign = typeof column === "string" ? "left" : column.align || "left"

        let cell: HTMLTableCellElement

        if (typeof cellData === "string") {
          cell = DOMFactory.td({
            className: "ms-table-td",
            style: `text-align: ${columnAlign};`,
            text: cellData,
          })
        } else if (cellData instanceof HTMLElement) {
          cell = DOMFactory.td({
            className: "ms-table-td",
            style: `text-align: ${columnAlign};`,
          })
          cell.appendChild(cellData)
        } else {
          // TTableCellConfig
          const align = cellData.align || columnAlign
          cell = DOMFactory.td({
            className: "ms-table-td",
            style: `text-align: ${align};${cellData.style || ""}`,
          })

          if (typeof cellData.content === "string") {
            cell.textContent = cellData.content
          } else {
            cell.appendChild(cellData.content)
          }
        }

        row.appendChild(cell)
      })

      tbody.appendChild(row)
    })

    return tbody
  }

  /**
   * Handle row click event
   */
  private handleRowClick(rowIndex: number, rowData?: unknown, event?: MouseEvent): void {
    if (!this.config.multiSelect) {
      // Single select: clear all other selections
      this.clearSelection()
    }
    if (event?.shiftKey && this.selectedRows.size > 0) {
      // Shift select: select range
      const selectedIndices = Array.from(this.selectedRows)
      const lastSelected = Math.max(...selectedIndices)
      const start = Math.min(lastSelected, rowIndex)
      const end = Math.max(lastSelected, rowIndex)

      for (let i = start; i <= end; i++) {
        this.selectRow(i)
      }
    } else {
      if (this.selectedRows.has(rowIndex)) {
        this.unselectRow(rowIndex)
      } else {
        this.selectRow(rowIndex)
      }
    }

    // Call callback if provided
    if (this.config.onRowClick) {
      const isSelected = this.selectedRows.has(rowIndex)
      this.config.onRowClick(rowIndex, rowData, isSelected)
    }
  }

  /**
   * Select a row by index
   */
  selectRow(rowIndex: number): void {
    if (!this.selectedRows.has(rowIndex)) {
      this.selectedRows.add(rowIndex)
      this.updateRowStyle(rowIndex, true)
    }
  }

  /**
   * Unselect a row by index
   */
  unselectRow(rowIndex: number): void {
    if (this.selectedRows.has(rowIndex)) {
      this.selectedRows.delete(rowIndex)
      this.updateRowStyle(rowIndex, false)
    }
  }

  /**
   * Clear all selections
   */
  clearSelection(): void {
    this.selectedRows.forEach((rowIndex) => {
      this.updateRowStyle(rowIndex, false)
    })
    this.selectedRows.clear()
  }

  /**
   * Update row visual style based on selection state
   */
  private updateRowStyle(rowIndex: number, selected: boolean): void {
    const row = this.rowElements.get(rowIndex)
    if (!row) {
      return
    }

    const rowConfig = this.config.rows[rowIndex]
    const baseStyle = rowConfig?.style || "border-bottom: 1px solid var(--ms-ink-surface);"

    if (selected) {
      row.style.cssText = baseStyle + " background: var(--ms-ink-info); font-weight: 500;"
    } else {
      row.style.cssText = baseStyle
    }
  }

  /**
   * Get selected row indices
   */
  getSelectedRows(): number[] {
    return Array.from(this.selectedRows)
  }

  /**
   * Get selected row data
   */
  getSelectedRowsData(): unknown[] {
    return Array.from(this.selectedRows)
      .map((index) => this.config.rows[index]?.data)
      .filter((data) => data !== undefined)
  }

  /**
   * Get the table element
   */
  getElement(): HTMLTableElement {
    return this.table
  }

  /**
   * Update table data and redraw
   */
  update(rows: TTableRow[]): void {
    this.config.rows = rows

    // Remove old tbody
    const oldTbody = this.table.querySelector("tbody")
    if (oldTbody) {
      oldTbody.remove()
    }

    // Create new tbody
    const newTbody = this.createBody()
    this.table.appendChild(newTbody)
  }

  /**
   * Destroy the table
   */
  destroy(): void {
    this.table.remove()
  }
}
