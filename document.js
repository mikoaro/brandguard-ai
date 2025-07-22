// Document Sandbox API Simulation
// Updated for canvas overlay structure

export class DocumentSandbox {
  constructor() {
    this.canvasOverlay = null
    this.init()
  }

  init() {
    this.canvasOverlay = document.getElementById("canvasOverlay")
    console.log("Document Sandbox initialized")
  }

  // Extract document data for compliance analysis
  async extractDocumentData() {
    const elements = this.canvasOverlay.querySelectorAll(".design-element")
    const documentData = {
      texts: [],
      colors: [],
      images: [],
      shapes: [],
      metadata: {
        pageCount: 1,
        documentId: "canvas-simulation",
        extractedAt: new Date().toISOString(),
      },
    }

    elements.forEach((element) => {
      const elementData = {
        id: element.dataset.id,
        type: element.dataset.type,
        position: {
          x: Number.parseInt(element.style.left) || 0,
          y: Number.parseInt(element.style.top) || 0,
        },
      }

      if (element.dataset.type === "text") {
        const computedStyle = window.getComputedStyle(element)
        const textData = {
          ...elementData,
          content: element.textContent,
          color: this.rgbToHex(computedStyle.color),
          fontFamily: computedStyle.fontFamily.replace(/['"]/g, ""),
          fontSize: Number.parseInt(computedStyle.fontSize),
          backgroundColor: this.getBackgroundColor(element),
        }
        documentData.texts.push(textData)

        // Add color to colors array if not already present
        if (textData.color && !documentData.colors.find((c) => c.value === textData.color)) {
          documentData.colors.push({
            value: textData.color,
            usage: "text",
            elementId: element.dataset.id,
          })
        }
      } else if (element.dataset.type === "shape") {
        const computedStyle = window.getComputedStyle(element)
        const shapeData = {
          ...elementData,
          color: this.rgbToHex(computedStyle.backgroundColor),
          width: Number.parseInt(element.style.width) || 0,
          height: Number.parseInt(element.style.height) || 0,
        }
        documentData.shapes.push(shapeData)

        // Add color to colors array
        if (shapeData.color && !documentData.colors.find((c) => c.value === shapeData.color)) {
          documentData.colors.push({
            value: shapeData.color,
            usage: "fill",
            elementId: element.dataset.id,
          })
        }
      } else if (element.dataset.type === "image" || element.dataset.type === "asset") {
        const imageData = {
          ...elementData,
          assetId: element.dataset.assetId,
          width: Number.parseInt(element.style.width) || 0,
          height: Number.parseInt(element.style.height) || 0,
        }
        documentData.images.push(imageData)
      }
    })

    console.log("Document data extracted:", documentData)
    return documentData
  }

  // Highlight an element on the canvas
  async highlightElement(nodeId) {
    const element = this.canvasOverlay.querySelector(`[data-id="${nodeId}"]`)
    if (element) {
      // Remove existing highlights
      this.canvasOverlay.querySelectorAll(".highlighted").forEach((el) => {
        el.classList.remove("highlighted")
      })

      // Add highlight to target element
      element.classList.add("highlighted")

      // Remove highlight after 3 seconds
      setTimeout(() => {
        element.classList.remove("highlighted")
      }, 3000)

      // Scroll element into view if needed
      element.scrollIntoView({ behavior: "smooth", block: "center" })

      return true
    }
    return false
  }

  // Apply a fix to an element
  async applyFix(nodeId, fixType, fixValue) {
    const element = this.canvasOverlay.querySelector(`[data-id="${nodeId}"]`)
    if (!element) return false

    switch (fixType) {
      case "color":
        if (element.dataset.type === "text") {
          element.style.color = fixValue
        } else if (element.dataset.type === "shape") {
          element.style.backgroundColor = fixValue
        }
        break

      case "font":
        if (element.dataset.type === "text") {
          element.style.fontFamily = fixValue
        }
        break

      case "fontSize":
        if (element.dataset.type === "text") {
          element.style.fontSize = fixValue
        }
        break

      default:
        console.warn("Unknown fix type:", fixType)
        return false
    }

    // Flash the element to indicate the fix was applied
    element.style.transition = "all 0.3s ease"
    element.style.transform = "scale(1.05)"
    setTimeout(() => {
      element.style.transform = "scale(1)"
      element.style.transition = ""
    }, 300)

    console.log("Fix applied:", { nodeId, fixType, fixValue })
    return true
  }

  // Add an asset to the canvas
  async addAssetToCanvas(assetId) {
    const canvas = this.canvasOverlay
    const element = document.createElement("div")
    element.className = "canvas-element shape-element"
    element.dataset.id = `asset-${assetId}-${Date.now()}`
    element.dataset.type = "asset"
    element.dataset.assetId = assetId

    // Position randomly but within canvas bounds
    const x = Math.random() * (canvas.offsetWidth - 100)
    const y = Math.random() * (canvas.offsetHeight - 100)

    element.style.cssText = `top: ${y}px; left: ${x}px; background-color: #4CAF50; width: 100px; height: 100px; border-radius: 8px;`
    element.textContent = "📎"
    element.style.display = "flex"
    element.style.alignItems = "center"
    element.style.justifyContent = "center"
    element.style.fontSize = "24px"

    canvas.appendChild(element)
    return true
  }

  // Utility methods for extracting computed styles
  getBackgroundColor(element) {
    // Try to find the background color by looking at parent elements
    let current = element.parentElement
    while (current && current !== document.body) {
      const computed = window.getComputedStyle(current)
      const bgColor = computed.backgroundColor
      if (bgColor && bgColor !== "rgba(0, 0, 0, 0)" && bgColor !== "transparent") {
        return this.rgbToHex(bgColor)
      }
      current = current.parentElement
    }
    return "#FFFFFF" // Default to white
  }

  // Convert RGB color to HEX
  rgbToHex(rgb) {
    if (rgb.startsWith("#")) return rgb

    const result = rgb.match(/\d+/g)
    if (!result || result.length < 3) return "#000000"

    const r = Number.parseInt(result[0])
    const g = Number.parseInt(result[1])
    const b = Number.parseInt(result[2])

    return (
      "#" +
      [r, g, b]
        .map((x) => {
          const hex = x.toString(16)
          return hex.length === 1 ? "0" + hex : hex
        })
        .join("")
        .toUpperCase()
    )
  }

  // Simulate document change events
  triggerDocumentChange() {
    const event = new CustomEvent("documentChange", {
      detail: { timestamp: Date.now() },
    })
    this.canvasOverlay.dispatchEvent(event)
  }
}
