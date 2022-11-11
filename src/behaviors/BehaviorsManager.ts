import { IBehaviors } from "../@types/Behaviors"
import { TConfiguration } from "../@types/Configuration"
import { IModel } from "../@types/model/Model"
import { RestBehaviors } from "./RestBehaviors"
import { WSBehaviors } from "./WSBehaviors"

export class BehaviorsManager
{
  behaviors!: IBehaviors

  constructor(configuration: TConfiguration, model: IModel, behaviors?: IBehaviors)
  {
    this.overrideDefaultBehaviors(configuration, model, behaviors)
  }

  overrideDefaultBehaviors(configuration: TConfiguration, model: IModel, behaviors?: IBehaviors)
  {
    if (this.behaviors) {
      this.behaviors.destroy()
    }
    let defaultBehaviors: IBehaviors
    if (configuration.server.protocol === 'REST') {
      defaultBehaviors = new RestBehaviors(configuration, model)
    } else {
      defaultBehaviors = new WSBehaviors(configuration, model)
    }

    this.behaviors = Object.assign(defaultBehaviors, behaviors)
  }

  init(domElement: HTMLElement): Promise<void | Error>
  {
    return this.behaviors.init(domElement)
  }

}