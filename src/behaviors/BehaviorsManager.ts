import { IBehaviors } from "../@types/Behaviors"
import { TConfiguration } from "../@types/Configuration"
import { RestBehaviors } from "./RestBehaviors"

export class BehaviorsManager
{
  behaviors!: IBehaviors

  constructor(configuration: TConfiguration, behaviors?: IBehaviors)
  {
    this.overrideDefaultBehaviors(configuration, behaviors)
  }

  overrideDefaultBehaviors(configuration: TConfiguration, behaviors?: IBehaviors)
  {
    const defaultBehaviors: IBehaviors = new RestBehaviors(configuration)
    // if (configuration.server.protocol === 'REST') {
    //   defaultBehaviors = new RestBehaviors(configuration)
    // } else {
    //   defaultBehaviors = new WSBehaviors(configuration)
    // }

    this.behaviors = Object.assign(defaultBehaviors, behaviors)
  }

  init(domElement: HTMLElement): Promise<boolean | Error>
  {
    return this.behaviors.init(domElement)
  }

}