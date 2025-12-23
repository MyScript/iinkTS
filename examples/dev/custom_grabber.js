import { PointerEventGrabber } from '../../dist/iink.esm.js'

export class CustomGrabber extends PointerEventGrabber {

  constructor(configuration) {
    super(configuration)
    this.downElement = document.getElementById("pointer-down")
    this.moveElement = document.getElementById("pointer-move")
    this.upElement = document.getElementById("pointer-up")
    this.downElement.textContent = "Down at:"
    this.moveElement.textContent = "Move to:"
    this.upElement.textContent = "Up at:"
  }

  pointerDownHandler = (evt) =>
  {
    if (evt.button !== 0 || evt.buttons !== 1) {
      let warning
      warning = "You have not clicked with only main button.\r"
      switch(evt.button) {
        case 1:
          warning += "Auxiliary button pressed, usually the wheel button or the middle button";
          break;
        case 2:
          warning += "Secondary button pressed, usually the right button";
          break;
        case 3:
          warning += "Fourth button, typically the Browser Back button";
          break;
        case 4:
          warning += "Fifth button, typically the Browser Forward button";
          break;
      }
      alert(warning)
      return
    }

    this.capturing = true
    this.pointerType = evt.pointerType


    if (this.onPointerDown) {
      /**
       * getPointerInfos inherits PointerEventGrabber
       */
      const pointerInfo = this.getPointerInfos(evt)
      this.downElement.textContent = `Down at: ${JSON.stringify(pointerInfo.pointer)}`
      this.moveElement.textContent = "Move to:"
      this.upElement.textContent = "Up at:"
      /**
       * onPointerDown is bind with the editor
       */
      this.onPointerDown(pointerInfo)
    }
  }

  pointerMoveHandler = (evt) =>
  {
    if (this.capturing && this.pointerType === evt.pointerType) {
      if (this.onPointerMove) {
        /**
         * getPointerInfos inherits PointerEventGrabber
         */
        const pointerInfo = this.getPointerInfos(evt)
        this.moveElement.textContent = `Move to: ${JSON.stringify(pointerInfo.pointer)}`
        /**
         * onPointerMove is bind with the editor
         */
        this.onPointerMove(pointerInfo)
      }
    }
  }

  pointerUpHandler = (evt) =>
  {
    if (this.capturing && this.pointerType === evt.pointerType) {
      this.pointerType = undefined
      this.capturing = false
      evt.stopPropagation()
      if (this.onPointerUp) {
        /**
         * getPointerInfos inherits PointerEventGrabber
         */
        const pointerInfo = this.getPointerInfos(evt)
        this.upElement.textContent = `Up at: ${JSON.stringify(pointerInfo.pointer)}`
        /**
         * onPointerUp is bind with the editor
         */
        this.onPointerUp(pointerInfo)
      }
    }
  }
}
