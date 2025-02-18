import { PartialDeep } from "../utils"

/**
 * @group Snap
 */
export type TSnapConfiguration = {
  guide: boolean
  symbol: boolean
  angle: number
}

/**
 * @group Snap
 * @source
 */
export const DefaultSnapConfiguration: TSnapConfiguration = {
  guide: true,
  symbol: true,
  angle: 0
}

/**
 * @group Snap
 */
export class SnapConfiguration implements TSnapConfiguration
{
  guide: boolean
  symbol: boolean
  angle: number

  constructor(config? : PartialDeep<TSnapConfiguration>)
  {
    this.symbol = config?.symbol !== undefined ? config.symbol : DefaultSnapConfiguration.symbol
    this.guide = config?.guide !== undefined ? config.guide : DefaultSnapConfiguration.guide
    this.angle = config?.angle !== undefined ? config.angle : DefaultSnapConfiguration.angle
  }
}
