class CustomGrabber extends iink.PointerEventGrabber {

  constructor(configuration, elements) {
    super(configuration)
    this.downElement = elements.down
    this.moveElement = elements.move
    this.upElement = elements.up
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

    this.activePointerId = evt.pointerId

    if (this.onPointerDown) {
      /**
       * extractPoint is inherit from PointerEventGrabber
       */
      const point = this.extractPoint(evt)
      this.downElement.textContent = `Down at: ${JSON.stringify(point)}`
      this.moveElement.textContent = "Move to:"
      this.upElement.textContent = "Up to:"
      /**
       * onPointerDown is bind with the behaviors
       */
      this.onPointerDown(evt, point)
    }
  }

  pointerMoveHandler = (evt) =>
  {
    if (this.activePointerId != undefined && this.activePointerId === evt.pointerId) {
      if (this.onPointerMove) {
        const point = this.extractPoint(evt)
        this.moveElement.textContent = `Move to: ${JSON.stringify(point)}`
        /**
         * onPointerMove is bind with the behaviors
         */
        this.onPointerMove(evt, point)
      }
    }
  }

  pointerUpHandler = (evt) =>
  {
    if (this.activePointerId != undefined && this.activePointerId === evt.pointerId) {
      this.activePointerId = undefined
      evt.stopPropagation()
      if (this.onPointerUp) {
        const point = this.extractPoint(evt)
        this.upElement.textContent = `Up at: ${JSON.stringify(point)}`
        /**
         * onPointerUp is bind with the behaviors
         */
        this.onPointerUp(evt, point)
      }
    }
  }
}
