import type { TButtonElConfig } from "./buttonElement"
import { buildButton } from "./buttonElement"
import type { TContainerElConfig } from "./containerElement"
import { buildDiv, buildH3, buildP, buildSection, buildSpan, buildStyle } from "./containerElement"
import type { TCheckboxElConfig, TFileInputElConfig, TInputElConfig, TRangeElConfig } from "./inputElement"
import { buildCheckbox, buildFileInput, buildNumberInput, buildRange, buildTextInput } from "./inputElement"
import type { TLabelElConfig } from "./labelElement"
import { buildLabel } from "./labelElement"
import { buildCanvas } from "./miscElement"
import type { TOutputElConfig } from "./outputElement"
import { buildOutput } from "./outputElement"
import type { TSelectElConfig, TSelectElOption } from "./selectElement"
import { buildOption, buildSelect } from "./selectElement"
import type { TTableBaseElConfig, TTableCellElConfig } from "./tableElement"
import { buildTable, buildTBody, buildTd, buildTh, buildTHead, buildTr } from "./tableElement"

/**
 * @group DOM
 * @remarks Static utility class for DOM element creation.
 */
export class DOMFactory {
  private constructor() {}

  static div(config?: TContainerElConfig): HTMLDivElement {
    return buildDiv(config)
  }
  static span(config?: TContainerElConfig): HTMLSpanElement {
    return buildSpan(config)
  }
  static p(config?: TContainerElConfig): HTMLParagraphElement {
    return buildP(config)
  }
  static h3(config?: TContainerElConfig): HTMLHeadingElement {
    return buildH3(config)
  }
  static section(config?: TContainerElConfig): HTMLElement {
    return buildSection(config)
  }
  static style(cssText: string, dataAttr?: Record<string, string>): HTMLStyleElement {
    return buildStyle(cssText, dataAttr)
  }
  static canvas(config?: { id?: string; className?: string }): HTMLCanvasElement {
    return buildCanvas(config)
  }

  static label(config: TLabelElConfig): HTMLLabelElement {
    return buildLabel(config)
  }

  static button(config: TButtonElConfig): HTMLButtonElement {
    return buildButton(config)
  }

  static textInput(config: TInputElConfig): HTMLInputElement {
    return buildTextInput(config)
  }

  static numberInput(config: TInputElConfig): HTMLInputElement {
    return buildNumberInput(config)
  }

  static checkbox(config: TCheckboxElConfig): HTMLInputElement {
    return buildCheckbox(config)
  }

  static range(config: TRangeElConfig): HTMLInputElement {
    return buildRange(config)
  }

  static fileInput(config: TFileInputElConfig): HTMLInputElement {
    return buildFileInput(config)
  }

  static select(config: TSelectElConfig): HTMLSelectElement {
    return buildSelect(config)
  }
  static option(opt: TSelectElOption): HTMLOptionElement {
    return buildOption(opt)
  }

  static output(config?: TOutputElConfig): HTMLOutputElement {
    return buildOutput(config)
  }

  static table(config?: TTableBaseElConfig): HTMLTableElement {
    return buildTable(config)
  }
  static thead(config?: TTableBaseElConfig): HTMLTableSectionElement {
    return buildTHead(config)
  }
  static tbody(config?: TTableBaseElConfig): HTMLTableSectionElement {
    return buildTBody(config)
  }
  static tr(config?: TTableBaseElConfig): HTMLTableRowElement {
    return buildTr(config)
  }
  static td(config?: TTableCellElConfig): HTMLTableCellElement {
    return buildTd(config)
  }
  static th(config?: TTableCellElConfig): HTMLTableCellElement {
    return buildTh(config)
  }

  // ─── Composites ───────────────────────────────────────────────────────────

  static colorDot(color: string, size = "12px"): HTMLSpanElement {
    return buildSpan({
      style: `
        width: ${size};
        height: ${size};
        border-radius: var(--ms-ink-radius-full);
        background-color: ${color};
        display: inline-block;
        flex-shrink: 0;
      `,
    })
  }

  static statusBadge(available: boolean): HTMLSpanElement {
    return buildSpan({
      text: available ? "✓" : "✗",
      style: available
        ? "color: var(--ms-ink-success); font-weight: bold; font-size: 16px;"
        : "color: var(--ms-ink-error); font-weight: bold; font-size: 16px;",
    })
  }

  static labeledInput(config: {
    id: string
    label: string
    type?: string
    defaultValue?: string | number
    placeholder?: string
    min?: number
    max?: number
    step?: string | number
    labelSize?: string
    gap?: string
  }): {
    wrapper: HTMLDivElement
    input: HTMLInputElement
    label: HTMLLabelElement
  } {
    const wrapper = buildDiv({
      style: `
      display: flex;
      flex-direction: column;
      gap: ${config.gap ?? "var(--ms-ink-spacing-xs)"};
    `,
    })
    const label = buildLabel({
      text: config.label,
      htmlFor: config.id,
      style: `font-size: ${config.labelSize ?? "13px"}; font-weight: 500;`,
    })
    const input = buildTextInput({
      id: config.id,
      value: config.defaultValue,
      placeholder: config.placeholder,
      step: config.step,
      min: config.min,
      max: config.max,
      fullWidth: true,
    })
    if (config.type) {
      input.type = config.type
    }
    wrapper.appendChild(label)
    wrapper.appendChild(input)
    return { wrapper, input, label }
  }
}
