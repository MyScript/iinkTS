/**
 * @REST
 * @websocket
 * Configure when the action is triggered.
 * POINTER_UP :   Action is triggered on every PenUP.
 *                This is the recommended mode for CDK V3 WebSocket recognitions.
 * QUIET_PERIOD : Action is triggered after a quiet period in milli-seconds on every pointer up.
 *                The value is set to 1000 for example recognition will be triggered when the user stops writing for 1 seconds.
 *                This is the recommended mode for all REST discoveries.
 * DEMAND :       Action is triggered on external demande
 */
 export type TTriggerConfiguration = {
  exportContent: "QUIET_PERIOD" | "POINTER_UP" | "DEMAND"
  exportContentDelay: number
  resizeTriggerDelay: number
}
