class CustomGrabber extends iink.PointerEventGrabber {

  constructor(configuration) {
    super(configuration)
    this.downElement = document.getElementById("pointer-down")
    this.moveElement = document.getElementById("pointer-move")
    this.upElement = document.getElementById("pointer-up")
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
       * extractPoint is inherit from PointerEventGrabber
       */
      const point = this.extractPoint(evt)
      this.downElement.textContent = `Down at: ${JSON.stringify(point)}`
      this.moveElement.textContent = "Move to:"
      this.upElement.textContent = "Up to:"
      /**
       * onPointerDown is bind with the editor
       */
      this.onPointerDown(evt, point)
    }
  }

  pointerMoveHandler = (evt) =>
  {
    if (this.capturing && this.pointerType === evt.pointerType) {
      if (this.onPointerMove) {
        const point = this.extractPoint(evt)
        this.moveElement.textContent = `Move to: ${JSON.stringify(point)}`
        /**
         * onPointerMove is bind with the editor
         */
        this.onPointerMove(evt, point)
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
        const point = this.extractPoint(evt)
        this.upElement.textContent = `Up at: ${JSON.stringify(point)}`
        /**
         * onPointerUp is bind with the editor
         */
        this.onPointerUp(evt, point)
      }
    }
  }
}
