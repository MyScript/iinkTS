import uploadIcon from "@/assets/svg/upload.svg"
import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import type { TMenuSubMenu } from "@/menu/items/SubMenuItem"
import { SubMenuItem } from "@/menu/items/SubMenuItem"
import type { TSymbol } from "@/symbol"
import type { TPartialDeep } from "@/utils"

/**
 * @group Menu
 * @remarks Menu action Import - Import de fichiers JSON
 */
export class ImportMenuAction extends SubMenuItem {
  constructor(editor: TInteractiveInkCanvas, idPrefix = "ms-menu-action") {
    const config: TMenuSubMenu = {
      type: "submenu",
      id: `${idPrefix}-import`,
      label: "Import",
      menuTitle: "Import",
      icon: uploadIcon,
      position: "right-top",
      items: [
        {
          type: "fileinput",
          id: `${idPrefix}-import-file`,
          label: "Import",
          accept: ".json",
          multiple: false,
          buttonLabel: "Import",
          action: async (editor, files) => {
            if (files.length) {
              const fileString = await this.readFileAsText(files[0])
              const symbols = JSON.parse(fileString) as TPartialDeep<TSymbol>[]
              await editor.createSymbols(symbols)
            }
          },
        },
      ],
    }

    super(config, editor)
  }

  private async readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = reject
      reader.onload = () => {
        resolve(reader.result as string)
      }
      if (file) {
        reader.readAsText(file)
      }
    })
  }
}
