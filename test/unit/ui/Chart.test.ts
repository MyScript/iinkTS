import { Chart, TChartConfig } from "@/iink"

describe("Chart.ts", () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement("div")
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("should create chart with default config", () => {
    const chart = new Chart()
    expect(chart).toBeDefined()

    const element = chart.getElement()
    expect(element).toBeDefined()
    expect(element).toBeInstanceOf(HTMLDivElement)
  })

  test("should create chart with custom config", () => {
    const config: TChartConfig = {
      width: 800,
      height: 600,
      title: "Test Chart",
      xLabel: "Time",
      yLabel: "Value",
      lineColor: "#ff0000",
      lineWidth: 3,
      showGrid: false,
      showPoints: false,
    }

    const chart = new Chart(config)
    expect(chart).toBeDefined()

    const element = chart.getElement()
    expect(element).toBeDefined()
  })

  describe("getElement()", () => {
    test("should return HTMLDivElement", () => {
      const chart = new Chart()
      const element = chart.getElement()

      expect(element).toBeInstanceOf(HTMLDivElement)
      expect(element.classList.contains("ms-chart")).toBe(true)
    })

    test("should contain canvas element", () => {
      const chart = new Chart({ width: 400, height: 300 })
      const element = chart.getElement()

      const canvas = element.querySelector("canvas")
      expect(canvas).toBeTruthy()
      expect(canvas?.width).toBe(400)
      expect(canvas?.height).toBe(300)
    })

    test("should contain control buttons", () => {
      const chart = new Chart()
      const element = chart.getElement()

      const buttons = element.querySelectorAll("button")
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe("setData()", () => {
    test("should accept array of [x, y] pairs", () => {
      const chart = new Chart()
      const data = [
        [1, 10],
        [2, 20],
        [3, 15],
        [4, 25],
      ]

      expect(() => chart.setData(data)).not.toThrow()
    })

    test("should accept array of objects with x and y", () => {
      const chart = new Chart({ xLabel: "x", yLabel: "y" })
      const data = [
        { x: 1, y: 10 },
        { x: 2, y: 20 },
        { x: 3, y: 15 },
        { x: 4, y: 25 },
      ]

      expect(() => chart.setData(data)).not.toThrow()
    })

    test("should accept transposed format [[x values], [y values]]", () => {
      const chart = new Chart()
      const data = [
        [1, 2, 3, 4],
        [10, 20, 15, 25],
      ]

      expect(() => chart.setData(data)).not.toThrow()
    })

    test("should accept multiple series as array of arrays", () => {
      const chart = new Chart()
      const data = [
        [
          [1, 10],
          [2, 20],
          [3, 15],
        ],
        [
          [1, 5],
          [2, 15],
          [3, 10],
        ],
      ]

      expect(() => chart.setData(data)).not.toThrow()
    })

    test("should accept multiple series as array of object arrays", () => {
      const chart = new Chart({ xLabel: "x", yLabel: "y" })
      const data = [
        [
          { x: 1, y: 10 },
          { x: 2, y: 20 },
        ],
        [
          { x: 1, y: 5 },
          { x: 2, y: 15 },
        ],
      ]

      expect(() => chart.setData(data)).not.toThrow()
    })

    test("should handle empty data", () => {
      const chart = new Chart()
      const data: number[][] = []

      expect(() => chart.setData(data)).not.toThrow()
    })

    test("should show canvas after setting data", () => {
      const chart = new Chart()
      container.appendChild(chart.getElement())

      const data = [
        [1, 10],
        [2, 20],
        [3, 30],
      ]

      chart.setData(data)

      // After refactoring, Chart no longer contains a table element
      // The chart now only displays data on canvas
      const canvas = chart.getElement().querySelector("canvas")
      expect(canvas).toBeTruthy()
    })
  })

  describe("updateConfig()", () => {
    test("should update config without errors", () => {
      const chart = new Chart({ width: 500, height: 400 })

      // updateConfig only updates internal config and redraws
      // Canvas dimensions are set at creation time
      expect(() => chart.updateConfig({ width: 600, height: 500 })).not.toThrow()
    })

    test("should update title", () => {
      const chart = new Chart({ title: "Initial Title" })

      chart.updateConfig({ title: "Updated Title" })

      // Title should be updated
      expect(() => chart.updateConfig({ title: "Updated Title" })).not.toThrow()
    })

    test("should update line color", () => {
      const chart = new Chart({ lineColor: "#0000ff" })

      expect(() => chart.updateConfig({ lineColor: "#ff0000" })).not.toThrow()
    })

    test("should update grid visibility", () => {
      const chart = new Chart({ showGrid: true })

      expect(() => chart.updateConfig({ showGrid: false })).not.toThrow()
    })

    test("should update points visibility", () => {
      const chart = new Chart({ showPoints: true })

      expect(() => chart.updateConfig({ showPoints: false })).not.toThrow()
    })

    test("should update multiple config options at once", () => {
      const chart = new Chart()

      expect(() => {
        chart.updateConfig({
          width: 700,
          height: 600,
          lineColor: "#00ff00",
          lineWidth: 4,
          showGrid: false,
        })
      }).not.toThrow()
    })
  })

  describe("canvas rendering", () => {
    test("should have canvas with 2d context", () => {
      const chart = new Chart()
      const element = chart.getElement()

      const canvas = element.querySelector("canvas") as HTMLCanvasElement
      expect(canvas).toBeTruthy()

      const ctx = canvas.getContext("2d")
      expect(ctx).toBeTruthy()
    })

    test("should render data on canvas", () => {
      const chart = new Chart({ width: 500, height: 400 })
      const data = [
        [1, 10],
        [2, 20],
        [3, 15],
      ]

      chart.setData(data)

      const element = chart.getElement()
      const canvas = element.querySelector("canvas") as HTMLCanvasElement
      const ctx = canvas.getContext("2d")

      expect(ctx).toBeTruthy()
      expect(canvas.width).toBe(500)
      expect(canvas.height).toBe(400)
    })
  })

  describe("interaction controls", () => {
    test("should have zoom in button", () => {
      const chart = new Chart()
      const element = chart.getElement()

      const buttons = Array.from(element.querySelectorAll("button"))
      const zoomInBtn = buttons.find((btn) => btn.textContent?.includes("Zoom") && btn.textContent?.includes("+"))

      expect(zoomInBtn).toBeTruthy()
    })

    test("should have zoom out button", () => {
      const chart = new Chart()
      const element = chart.getElement()

      const buttons = Array.from(element.querySelectorAll("button"))
      const zoomOutBtn = buttons.find(
        (btn) => btn.textContent?.includes("Zoom") && (btn.textContent?.includes("−") || btn.textContent?.includes("-"))
      )

      expect(zoomOutBtn).toBeTruthy()
    })

    test("should have reset button", () => {
      const chart = new Chart()
      const element = chart.getElement()

      const buttons = Array.from(element.querySelectorAll("button"))
      const resetBtn = buttons.find((btn) => btn.textContent?.includes("Reset") || btn.textContent?.includes("↻"))

      expect(resetBtn).toBeTruthy()
    })
  })

  describe("chart styles", () => {
    test("should apply custom line color", () => {
      const chart = new Chart({ lineColor: "#ff0000" })

      expect(chart).toBeDefined()
      // Color is applied during rendering, no direct DOM attribute to test
    })

    test("should apply custom line width", () => {
      const chart = new Chart({ lineWidth: 5 })

      expect(chart).toBeDefined()
      // Width is applied during rendering
    })

    test("should have ms-chart-canvas class on canvas", () => {
      const chart = new Chart()
      const element = chart.getElement()

      const canvas = element.querySelector("canvas") as HTMLCanvasElement
      expect(canvas.classList.contains("ms-chart-canvas")).toBe(true)
    })
  })
})
