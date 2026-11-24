import { DEMO_EXERCISES } from "../../../../../examples/interactive-canvas/interactive_canvas_math_tutor/demo-exercises.js"
import { nextExercise } from "../../../../../examples/interactive-canvas/interactive_canvas_math_tutor/playlist.js"

describe("interactive_canvas_math_tutor/playlist", () => {
  const constant = () => 0.5

  describe("nextExercise", () => {
    test("should play the demo exercises of a level first, then generated ones", () => {
      const demoLevel = DEMO_EXERCISES.filter((exercise) => exercise.level === "geometry-2")
      demoLevel.forEach((exercise, played) => expect(nextExercise("geometry-2", played, constant)).toBe(exercise))
      expect(nextExercise("geometry-2", demoLevel.length, constant).id).toMatch(/^generated-/)
    })
  })
})
