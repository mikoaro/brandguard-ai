// BrandGuard AI Adobe Express Add-on
// Main application logic with canvas-based UI

import { DocumentSandbox } from "./document.js"
import { BrandGuardAPI } from "./api.js"
import { StateManager } from "./state.js"

class BrandGuardApp {
  constructor() {
    this.documentSandbox = new DocumentSandbox()
    this.api = new BrandGuardAPI()
    this.state = new StateManager()
    this.currentUser = null
    this.continuousMode = false
    this.scanTimeout = null
    this.selectedElement = null

    this.init()
  }

  async init() {
    this.setupEventListeners()
    this.loadUserProfile()
    this.loadLastScanResults()
    this.populateBrandAssets()
    this.initializeCanvas()

    console.log("BrandGuard AI initialized successfully")
  }

  setupEventListeners() {
    // Panel tabs
    document.querySelectorAll(".panel-tab").forEach((tab) => {
      tab.addEventListener("click", (e) => this.switchTab(e.target.dataset.tab))
    })

    // Authentication
    document.getElementById("connectBtn").addEventListener("click", () => this.showAuthModal())
    document.getElementById("closeModal").addEventListener("click", () => this.hideAuthModal())
    document.getElementById("orgSelect").addEventListener("change", (e) => this.onOrganizationChange(e.target.value))
    document.getElementById("connectButton").addEventListener("click", () => this.connectUser())
    document.getElementById("resetButton").addEventListener("click", () => this.resetUserProfile())

    // Scanning
    document.getElementById("scanBtn").addEventListener("click", () => this.scanDocument())
    document
      .getElementById("continuousMode")
      .addEventListener("change", (e) => this.toggleContinuousMode(e.target.checked))

    // Tone analysis
    document.getElementById("analyzeToneBtn").addEventListener("click", () => this.analyzeTone())

    // Canvas tools
    document.querySelectorAll(".tool-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => this.selectTool(e.target.dataset.tool))
    })

    // Category expansion
    document.querySelectorAll(".category-header").forEach((header) => {
      header.addEventListener("click", () => this.toggleCategory(header))
    })

    // Asset search and filtering
    document.getElementById("assetSearch").addEventListener("input", (e) => this.filterAssets(e.target.value))
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => this.filterAssetsByType(e.target.dataset.filter))
    })

    // Canvas interactions
    this.setupCanvasInteractions()

    // Add this line after the other event listeners
    document.getElementById("fixAllLegalBtn").addEventListener("click", () => this.addAllLegalText())
  }

  // Tab Management
  switchTab(tabName) {
    document.querySelectorAll(".panel-tab").forEach((tab) => tab.classList.remove("active"))
    document.querySelector(`[data-tab="${tabName}"]`).classList.add("active")

    document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.remove("active"))
    document.getElementById(tabName).classList.add("active")
  }

  // Tool Selection
  selectTool(toolName) {
    document.querySelectorAll(".tool-btn").forEach((btn) => btn.classList.remove("active"))
    document.querySelector(`[data-tool="${toolName}"]`).classList.add("active")

    if (toolName === "brandguard") {
      document.getElementById("brandguardPanel").style.display = "flex"
    }
  }

  // Authentication
  showAuthModal() {
    document.getElementById("authModal").classList.remove("hidden")
  }

  hideAuthModal() {
    document.getElementById("authModal").classList.add("hidden")
  }

  onOrganizationChange(orgId) {
    const profileSelect = document.getElementById("profileSelect")
    const connectButton = document.getElementById("connectButton")

    if (orgId) {
      profileSelect.disabled = false
      profileSelect.innerHTML = this.getBrandProfilesForOrg(orgId)
      connectButton.disabled = false
    } else {
      profileSelect.disabled = true
      profileSelect.innerHTML = '<option value="">Select organization first...</option>'
      connectButton.disabled = true
    }
  }

  getBrandProfilesForOrg(orgId) {
    const profiles = {
      "acme-corp": [
        '<option value="">Choose brand profile...</option>',
        '<option value="main">Main Corporate Brand</option>',
        '<option value="product-x">Product X Campaign</option>',
        '<option value="internal">Internal Communications</option>',
      ],
      "tech-innovations": [
        '<option value="">Choose brand profile...</option>',
        '<option value="corporate">Corporate Identity</option>',
        '<option value="startup">Startup Division</option>',
      ],
      "global-finance": [
        '<option value="">Choose brand profile...</option>',
        '<option value="retail">Retail Banking</option>',
        '<option value="investment">Investment Services</option>',
        '<option value="corporate">Corporate Banking</option>',
      ],
    }

    return profiles[orgId]?.join("") || '<option value="">No profiles available</option>'
  }

  async connectUser() {
    const orgId = document.getElementById("orgSelect").value
    const profileId = document.getElementById("profileSelect").value

    if (!orgId || !profileId) {
      alert("Please select both organization and brand profile")
      return
    }

    const userId = this.generateUUID()
    this.currentUser = {
      id: userId,
      organization: orgId,
      brandProfile: profileId,
      connectedAt: new Date().toISOString(),
    }

    this.state.set("currentUser", this.currentUser)
    this.updateUserInterface()
    this.hideAuthModal()
    await this.loadBrandProfile()

    console.log("User connected:", this.currentUser)
  }

  resetUserProfile() {
    this.currentUser = null
    this.state.clear("currentUser")
    this.state.clear("lastScanResults")
    this.updateUserInterface()
    this.resetComplianceResults()
    console.log("User profile reset")
  }

  loadUserProfile() {
    const savedUser = this.state.get("currentUser")
    if (savedUser) {
      this.currentUser = savedUser
      this.updateUserInterface()
      this.loadBrandProfile()
    }
  }

  updateUserInterface() {
    const userStatus = document.getElementById("userStatus")
    const connectBtn = document.getElementById("connectBtn")

    if (this.currentUser) {
      userStatus.textContent = `${this.currentUser.organization}`
      connectBtn.textContent = "Disconnect"
      connectBtn.onclick = () => this.resetUserProfile()
    } else {
      userStatus.textContent = "Not connected"
      connectBtn.textContent = "Connect"
      connectBtn.onclick = () => this.showAuthModal()
    }
  }

  async loadBrandProfile() {
    if (!this.currentUser) return

    try {
      const profile = await this.api.getBrandProfile(this.currentUser.organization, this.currentUser.brandProfile)
      this.state.set("brandProfile", profile)
      console.log("Brand profile loaded:", profile)
    } catch (error) {
      console.error("Failed to load brand profile:", error)
    }
  }

  // Canvas Management
  initializeCanvas() {
    const canvas = document.getElementById("designCanvas")
    const ctx = canvas.getContext("2d")

    // Draw grid
    this.drawGrid(ctx, canvas.width, canvas.height)

    // Setup element interactions
    this.setupElementInteractions()
  }

  drawGrid(ctx, width, height) {
    ctx.strokeStyle = "#f0f0f0"
    ctx.lineWidth = 1

    const gridSize = 20

    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
  }

  setupCanvasInteractions() {
    const overlay = document.getElementById("canvasOverlay")

    overlay.addEventListener("dragover", (e) => {
      e.preventDefault()
      overlay.style.backgroundColor = "rgba(0, 102, 204, 0.1)"
    })

    overlay.addEventListener("dragleave", () => {
      overlay.style.backgroundColor = "transparent"
    })

    overlay.addEventListener("drop", (e) => {
      e.preventDefault()
      overlay.style.backgroundColor = "transparent"

      const assetId = e.dataTransfer.getData("text/plain")
      if (assetId) {
        const rect = overlay.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        this.addAssetToCanvas(assetId, x, y)
      }
    })
  }

  setupElementInteractions() {
    document.querySelectorAll(".design-element").forEach((element) => {
      this.makeElementInteractive(element)
    })
  }

  makeElementInteractive(element) {
    let isDragging = false
    let startX, startY, startLeft, startTop

    element.addEventListener("click", (e) => {
      e.stopPropagation()
      this.selectElement(element)
    })

    element.addEventListener("mousedown", (e) => {
      isDragging = true
      startX = e.clientX
      startY = e.clientY
      startLeft = Number.parseInt(element.style.left) || 0
      startTop = Number.parseInt(element.style.top) || 0
      element.style.zIndex = "1000"
      e.preventDefault()
    })

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return

      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY

      element.style.left = startLeft + deltaX + "px"
      element.style.top = startTop + deltaY + "px"
    })

    document.addEventListener("mouseup", () => {
      if (isDragging) {
        isDragging = false
        element.style.zIndex = ""

        if (this.continuousMode) {
          this.debouncedScan()
        }
      }
    })
  }

  selectElement(element) {
    document.querySelectorAll(".design-element").forEach((el) => el.classList.remove("selected"))
    element.classList.add("selected")
    this.selectedElement = element
  }

  // Document Scanning
  async scanDocument() {
    if (!this.currentUser) {
      alert("Please connect to your organization first")
      return
    }

    const scanBtn = document.getElementById("scanBtn")
    const loadingState = document.getElementById("loadingState")

    scanBtn.disabled = true
    loadingState.classList.remove("hidden")

    try {
      const documentData = await this.documentSandbox.extractDocumentData()
      console.log("Document data extracted:", documentData)

      const results = await this.api.analyzeCompliance(documentData)
      console.log("Compliance results:", results)

      this.displayComplianceResults(results)
      this.state.set("lastScanResults", {
        results,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Scan failed:", error)
      alert("Scan failed. Please try again.")
    } finally {
      scanBtn.disabled = false
      loadingState.classList.add("hidden")
    }
  }

  displayComplianceResults(results) {
    this.updateComplianceScore(results.overallScore)
    this.updateCategoryResults("brand", results.brandCompliance)
    this.updateCategoryResults("accessibility", results.accessibility)
    this.updateCategoryResults("legal", results.legalCompliance)

    document.getElementById("lastScan").textContent = `Last scan: ${new Date().toLocaleString()}`

    // Show fix all legal button if there are legal issues
    const fixAllLegalBtn = document.getElementById("fixAllLegalBtn")
    const hasLegalIssues = results.legalCompliance.some((issue) => issue.title.includes("Missing required legal text"))

    if (hasLegalIssues) {
      fixAllLegalBtn.style.display = "flex"
    } else {
      fixAllLegalBtn.style.display = "none"
    }
  }

  updateComplianceScore(score) {
    const scoreCircle = document.getElementById("scoreCircle")
    const scoreValue = document.getElementById("scoreValue")
    const scoreStatus = document.getElementById("scoreStatus")

    scoreValue.textContent = `${score}%`

    let color, status
    if (score >= 90) {
      color = "var(--adobe-green)"
      status = "Excellent"
    } else if (score >= 70) {
      color = "var(--adobe-orange)"
      status = "Good"
    } else {
      color = "var(--adobe-red)"
      status = "Needs work"
    }

    const angle = (score / 100) * 360
    scoreCircle.style.background = `conic-gradient(${color} ${angle}deg, var(--gray-300) ${angle}deg)`
    scoreStatus.textContent = status
  }

  updateCategoryResults(category, issues) {
    const countElement = document.getElementById(`${category}Count`)
    const issuesContainer = document.getElementById(`${category}Issues`)

    countElement.textContent = issues.length.toString()

    if (issues.length === 0) {
      issuesContainer.innerHTML =
        '<div style="text-align: center; color: var(--gray-500); padding: 12px;">No issues found</div>'
    } else {
      issuesContainer.innerHTML = issues.map((issue) => this.createIssueHTML(issue)).join("")
    }
  }

  createIssueHTML(issue) {
    const isLegalIssue = issue.nodeId === "document" && issue.title.includes("Missing required legal text")
    const legalText = isLegalIssue ? issue.description.match(/"([^"]+)"/)?.[1] : null

    return `
      <div class="issue-item ${issue.severity}">
        <div class="issue-info">
          <div class="issue-title">${issue.title}</div>
          <div class="issue-description">${issue.description}</div>
        </div>
        <div class="issue-actions">
          ${!isLegalIssue ? `<button class="btn-locate" onclick="app.locateIssue('${issue.nodeId}')">Locate</button>` : ""}
          ${issue.fixable ? `<button class="btn-fix" onclick="app.fixIssue('${issue.nodeId}', '${issue.fixType}', '${issue.fixValue}')">Fix</button>` : ""}
          ${isLegalIssue && legalText ? `<button class="btn-fix" onclick="app.fixLegalIssue('${legalText}')">Add Text</button>` : ""}
        </div>
      </div>
    `
  }

  async locateIssue(nodeId) {
    try {
      await this.documentSandbox.highlightElement(nodeId)
      console.log("Element highlighted:", nodeId)
    } catch (error) {
      console.error("Failed to locate element:", error)
    }
  }

  async fixIssue(nodeId, fixType, fixValue) {
    try {
      await this.documentSandbox.applyFix(nodeId, fixType, fixValue)
      console.log("Fix applied:", { nodeId, fixType, fixValue })
      setTimeout(() => this.scanDocument(), 500)
    } catch (error) {
      console.error("Failed to apply fix:", error)
    }
  }

  async fixLegalIssue(requiredText) {
    try {
      // Create a new text element with the required legal text
      const overlay = document.getElementById("canvasOverlay")
      const element = document.createElement("div")
      element.className = "design-element text-element"
      element.dataset.id = `legal-text-${Date.now()}`
      element.dataset.type = "text"

      // Position at bottom of canvas
      const canvasHeight = overlay.offsetHeight
      const posX = 20
      const posY = canvasHeight - 40

      element.style.cssText = `left: ${posX}px; top: ${posY}px; color: #666666; font-family: Arial; font-size: 12px; font-weight: normal;`
      element.textContent = requiredText

      this.makeElementInteractive(element)
      overlay.appendChild(element)

      console.log("Legal text added:", requiredText)

      // Re-scan after adding legal text
      setTimeout(() => this.scanDocument(), 500)

      return true
    } catch (error) {
      console.error("Failed to add legal text:", error)
      return false
    }
  }

  toggleContinuousMode(enabled) {
    this.continuousMode = enabled
    console.log("Continuous mode:", enabled ? "enabled" : "disabled")
  }

  debouncedScan() {
    clearTimeout(this.scanTimeout)
    this.scanTimeout = setTimeout(() => {
      if (this.continuousMode && this.currentUser) {
        this.scanDocument()
      }
    }, 2000)
  }

  // Category Management
  toggleCategory(header) {
    const category = header.parentElement
    const isExpanded = category.classList.contains("expanded")

    if (isExpanded) {
      category.classList.remove("expanded")
    } else {
      category.classList.add("expanded")
    }
  }

  // Tone Analysis
  async analyzeTone() {
    const toneText = document.getElementById("toneTextarea").value.trim()
    const resultsContainer = document.getElementById("toneResults")

    if (!toneText) {
      alert("Please enter some text to analyze")
      return
    }

    if (!this.currentUser) {
      alert("Please connect to your organization first")
      return
    }

    try {
      const results = await this.api.analyzeTone(toneText)
      this.displayToneResults(results)
    } catch (error) {
      console.error("Tone analysis failed:", error)
      alert("Tone analysis failed. Please try again.")
    }
  }

  displayToneResults(results) {
    const resultsContainer = document.getElementById("toneResults")

    const scoreClass = results.isCompliant ? "compliant" : "issues"
    const violationsHTML = results.violations
      .map(
        (violation) => `
          <div class="tone-violation">
            <div class="violation-rule">${violation.ruleName}</div>
            <div class="violation-text">"${violation.foundText}"</div>
            <div class="violation-suggestion">${violation.suggestion}</div>
          </div>
        `,
      )
      .join("")

    resultsContainer.innerHTML = `
      <div class="tone-score">
        <div class="tone-score-header">
          <h4>Analysis Results</h4>
          <div class="tone-score-value ${scoreClass}">
            ${results.isCompliant ? "✓ Compliant" : "⚠ Issues Found"}
          </div>
        </div>
        ${
          results.violations.length > 0
            ? `
            <div class="tone-violations">
              <h5>Violations Found:</h5>
              ${violationsHTML}
            </div>
          `
            : '<p style="color: var(--adobe-green);">Your content follows the brand tone guidelines!</p>'
        }
      </div>
    `
  }

  // Brand Assets
  async populateBrandAssets() {
    try {
      const assets = await this.api.getBrandAssets()
      this.displayBrandAssets(assets)
    } catch (error) {
      console.error("Failed to load brand assets:", error)
    }
  }

  displayBrandAssets(assets) {
    const assetsGrid = document.getElementById("assetsGrid")

    assetsGrid.innerHTML = assets
      .map(
        (asset) => `
          <div class="asset-item" draggable="true" data-asset-id="${asset.id}" data-asset-type="${asset.type}">
            <div class="asset-preview">${asset.preview}</div>
            <div class="asset-name">${asset.name}</div>
            <div class="asset-type">${asset.type}</div>
          </div>
        `,
      )
      .join("")

    // Add drag and drop functionality
    assetsGrid.querySelectorAll(".asset-item").forEach((item) => {
      item.addEventListener("dragstart", (e) => this.handleAssetDragStart(e))
      item.addEventListener("click", (e) => this.addAssetToCanvas(e.currentTarget.dataset.assetId))
    })
  }

  handleAssetDragStart(e) {
    const assetId = e.target.dataset.assetId
    e.dataTransfer.setData("text/plain", assetId)
    console.log("Asset drag started:", assetId)
  }

  async addAssetToCanvas(assetId, x = null, y = null) {
    try {
      const overlay = document.getElementById("canvasOverlay")
      const element = document.createElement("div")
      element.className = "design-element image-element"
      element.dataset.id = `asset-${assetId}-${Date.now()}`
      element.dataset.type = "asset"
      element.dataset.assetId = assetId

      // Position randomly if coordinates not provided
      const posX = x || Math.random() * (overlay.offsetWidth - 100)
      const posY = y || Math.random() * (overlay.offsetHeight - 100)

      element.style.cssText = `left: ${posX}px; top: ${posY}px; width: 100px; height: 100px; background: linear-gradient(45deg, #4CAF50, #2196F3); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px;`
      element.textContent = "📎"

      this.makeElementInteractive(element)
      overlay.appendChild(element)

      console.log("Asset added to canvas:", assetId)
    } catch (error) {
      console.error("Failed to add asset to canvas:", error)
    }
  }

  filterAssets(searchTerm) {
    const assets = document.querySelectorAll(".asset-item")
    assets.forEach((asset) => {
      const name = asset.querySelector(".asset-name").textContent.toLowerCase()
      const visible = name.includes(searchTerm.toLowerCase())
      asset.style.display = visible ? "block" : "none"
    })
  }

  filterAssetsByType(type) {
    document.querySelectorAll(".filter-btn").forEach((btn) => btn.classList.remove("active"))
    document.querySelector(`[data-filter="${type}"]`).classList.add("active")

    const assets = document.querySelectorAll(".asset-item")
    assets.forEach((asset) => {
      const assetType = asset.dataset.assetType
      const visible = type === "all" || assetType === type
      asset.style.display = visible ? "block" : "none"
    })
  }

  // Utility Functions
  generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c == "x" ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  loadLastScanResults() {
    const lastResults = this.state.get("lastScanResults")
    if (lastResults && this.currentUser) {
      this.displayComplianceResults(lastResults.results)
      document.getElementById("lastScan").textContent = `Last scan: ${new Date(lastResults.timestamp).toLocaleString()}`
    }
  }

  resetComplianceResults() {
    document.getElementById("scoreValue").textContent = "--"
    document.getElementById("scoreStatus").textContent = "Ready to scan"
    document.getElementById("lastScan").textContent = "Click scan to analyze"
    document.getElementById("scoreCircle").style.background = "conic-gradient(var(--gray-300) 0deg)"
    ;["brand", "accessibility", "legal"].forEach((category) => {
      document.getElementById(`${category}Count`).textContent = "0"
      document.getElementById(`${category}Issues`).innerHTML =
        '<div style="text-align: center; color: var(--gray-500); padding: 12px;">No issues found</div>'
    })
  }

  async addAllLegalText() {
    const brandProfile = this.state.get("brandProfile")
    if (!brandProfile?.legal?.requiredText) return

    const overlay = document.getElementById("canvasOverlay")
    const existingText = Array.from(overlay.querySelectorAll(".text-element"))
      .map((el) => el.textContent)
      .join(" ")

    const missingTexts = brandProfile.legal.requiredText.filter((text) => !existingText.includes(text))

    let yOffset = 0
    for (const text of missingTexts) {
      const element = document.createElement("div")
      element.className = "design-element text-element"
      element.dataset.id = `legal-text-${Date.now()}-${yOffset}`
      element.dataset.type = "text"

      const canvasHeight = overlay.offsetHeight
      const posX = 20
      const posY = canvasHeight - 60 + yOffset

      element.style.cssText = `left: ${posX}px; top: ${posY}px; color: #666666; font-family: Arial; font-size: 12px; font-weight: normal;`
      element.textContent = text

      this.makeElementInteractive(element)
      overlay.appendChild(element)

      yOffset += 20
    }

    // Re-scan after adding all legal text
    setTimeout(() => this.scanDocument(), 500)
  }
}

// Initialize the application
const app = new BrandGuardApp()

// Make app globally available for onclick handlers
window.app = app

export default BrandGuardApp
