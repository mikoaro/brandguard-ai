// BrandGuard API Client
// Handles communication with backend services and mock API responses

export class BrandGuardAPI {
  constructor() {
    this.baseURL = "https://api.brandguard.ai/v1"
    this.mockMode = true // Set to false for real API calls
    this.init()
  }

  init() {
    console.log("BrandGuard API client initialized")
  }

  // Get brand profile for organization
  async getBrandProfile(organizationId, profileId) {
    if (this.mockMode) {
      return this.getMockBrandProfile(organizationId, profileId)
    }

    try {
      const response = await fetch(`${this.baseURL}/organizations/${organizationId}/profiles/${profileId}`, {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Failed to fetch brand profile:", error)
      throw error
    }
  }

  getMockBrandProfile(organizationId, profileId) {
    const profiles = {
      "acme-corp": {
        main: {
          id: "main",
          name: "Main Corporate Brand",
          colors: {
            primary: ["#0066CC", "#004499", "#0080FF"],
            secondary: ["#FF6600", "#CC5500", "#FF8033"],
            neutral: ["#333333", "#666666", "#999999", "#CCCCCC", "#FFFFFF"],
          },
          fonts: {
            primary: ["Inter", "Helvetica Neue", "Arial"],
            secondary: ["Georgia", "Times New Roman"],
          },
          logos: {
            primary: "/assets/logos/acme-primary.svg",
            secondary: "/assets/logos/acme-secondary.svg",
            icon: "/assets/logos/acme-icon.svg",
          },
          legal: {
            requiredText: ["© 2025 ACME Corporation", "All rights reserved"],
          },
          accessibility: {
            minContrastRatio: 4.5,
            largeTextRatio: 3.0,
          },
        },
      },
      "tech-innovations": {
        corporate: {
          id: "corporate",
          name: "Corporate Identity",
          colors: {
            primary: ["#2E8B57", "#228B22", "#32CD32"],
            secondary: ["#FF4500", "#FF6347"],
            neutral: ["#2F2F2F", "#696969", "#A9A9A9", "#D3D3D3", "#FFFFFF"],
          },
          fonts: {
            primary: ["Roboto", "Open Sans", "Arial"],
            secondary: ["Merriweather", "Georgia"],
          },
        },
      },
      "global-finance": {
        retail: {
          id: "retail",
          name: "Retail Banking",
          colors: {
            primary: ["#1E3A8A", "#1E40AF", "#3B82F6"],
            secondary: ["#059669", "#10B981"],
            neutral: ["#1F2937", "#4B5563", "#9CA3AF", "#E5E7EB", "#FFFFFF"],
          },
          fonts: {
            primary: ["Source Sans Pro", "Helvetica", "Arial"],
            secondary: ["Lora", "Times New Roman"],
          },
          legal: {
            requiredText: ["© 2025 Global Finance Group", "Member FDIC", "Equal Housing Lender"],
          },
        },
      },
    }

    return profiles[organizationId]?.[profileId] || this.getDefaultBrandProfile()
  }

  getDefaultBrandProfile() {
    return {
      id: "default",
      name: "Default Brand Profile",
      colors: {
        primary: ["#0066CC"],
        secondary: ["#FF6600"],
        neutral: ["#333333", "#666666", "#999999", "#CCCCCC", "#FFFFFF"],
      },
      fonts: {
        primary: ["Arial", "Helvetica", "sans-serif"],
        secondary: ["Georgia", "Times New Roman", "serif"],
      },
      legal: {
        requiredText: ["© 2025 Company Name"],
      },
      accessibility: {
        minContrastRatio: 4.5,
        largeTextRatio: 3.0,
      },
    }
  }

  // Analyze document compliance
  async analyzeCompliance(documentData) {
    if (this.mockMode) {
      return this.getMockComplianceResults(documentData)
    }

    try {
      const response = await fetch(`${this.baseURL}/analyze`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(documentData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Failed to analyze compliance:", error)
      throw error
    }
  }

  getMockComplianceResults(documentData) {
    const brandProfile = JSON.parse(localStorage.getItem("brandguard_brandProfile")) || this.getDefaultBrandProfile()
    const results = {
      overallScore: 0,
      brandCompliance: [],
      accessibility: [],
      legalCompliance: [],
      timestamp: new Date().toISOString(),
    }

    let totalChecks = 0
    let passedChecks = 0

    // Analyze colors
    documentData.colors.forEach((colorData) => {
      totalChecks++
      const isApproved = this.isColorApproved(colorData.value, brandProfile)

      if (!isApproved) {
        results.brandCompliance.push({
          nodeId: colorData.elementId,
          title: "Non-approved color used",
          description: `Color ${colorData.value} is not in the approved brand palette`,
          severity: "error",
          fixable: true,
          fixType: "color",
          fixValue: this.getClosestApprovedColor(colorData.value, brandProfile),
        })
      } else {
        passedChecks++
      }
    })

    // Analyze fonts
    documentData.texts.forEach((textData) => {
      totalChecks++
      const isApproved = this.isFontApproved(textData.fontFamily, brandProfile)

      if (!isApproved) {
        results.brandCompliance.push({
          nodeId: textData.id,
          title: "Non-approved font used",
          description: `Font "${textData.fontFamily}" is not in the approved brand fonts`,
          severity: "warning",
          fixable: true,
          fixType: "font",
          fixValue: brandProfile.fonts.primary[0],
        })
      } else {
        passedChecks++
      }

      // Check accessibility (contrast ratio)
      if (textData.color && textData.backgroundColor) {
        totalChecks++
        const contrastRatio = this.calculateContrastRatio(textData.color, textData.backgroundColor)
        const minRatio =
          textData.fontSize >= 18
            ? brandProfile.accessibility?.largeTextRatio || 3.0
            : brandProfile.accessibility?.minContrastRatio || 4.5

        if (contrastRatio < minRatio) {
          results.accessibility.push({
            nodeId: textData.id,
            title: "Low color contrast",
            description: `Contrast ratio ${contrastRatio.toFixed(2)}:1 is below the required ${minRatio}:1 for ${textData.fontSize >= 18 ? "large" : "normal"} text`,
            severity: "error",
            fixable: true,
            fixType: "color",
            fixValue: this.getHighContrastColor(textData.backgroundColor),
          })
        } else {
          passedChecks++
        }
      }
    })

    // Check legal compliance
    if (brandProfile.legal?.requiredText) {
      const allText = documentData.texts.map((t) => t.content).join(" ")

      brandProfile.legal.requiredText.forEach((requiredText) => {
        totalChecks++
        if (!allText.includes(requiredText)) {
          results.legalCompliance.push({
            nodeId: "document",
            title: "Missing required legal text",
            description: `Required text "${requiredText}" is missing from the document`,
            severity: "error",
            fixable: false,
          })
        } else {
          passedChecks++
        }
      })
    }

    // Calculate overall score
    results.overallScore = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100

    return results
  }

  // Analyze tone of voice
  async analyzeTone(text) {
    if (this.mockMode) {
      return this.getMockToneAnalysis(text)
    }

    try {
      const response = await fetch(`${this.baseURL}/analyze-tone`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Failed to analyze tone:", error)
      throw error
    }
  }

  getMockToneAnalysis(text) {
    const violations = []

    // Mock compliance rules
    const rules = [
      {
        name: "No Forward-Looking Guarantees",
        pattern: /\b(guarantee(s|d)?|will provide|promise(s|d)?)\b/gi,
        description: "Do not promise or guarantee future performance.",
      },
      {
        name: "Avoid Superlatives",
        pattern: /\b(best|perfect|greatest|ultimate|amazing)\b/gi,
        description: "Avoid unsubstantiated superlative claims.",
      },
      {
        name: "Professional Tone",
        pattern: /\b(awesome|cool|sick|lit|fire)\b/gi,
        description: "Maintain professional language appropriate for business communications.",
      },
    ]

    rules.forEach((rule) => {
      const matches = text.match(rule.pattern)
      if (matches) {
        matches.forEach((match) => {
          violations.push({
            ruleName: rule.name,
            foundText: match,
            suggestion: `Replace "${match}" with more appropriate language. ${rule.description}`,
          })
        })
      }
    })

    return {
      isCompliant: violations.length === 0,
      violations: violations,
      analyzedAt: new Date().toISOString(),
    }
  }

  // Get brand assets
  async getBrandAssets() {
    if (this.mockMode) {
      return this.getMockBrandAssets()
    }

    try {
      const response = await fetch(`${this.baseURL}/assets`, {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Failed to fetch brand assets:", error)
      throw error
    }
  }

  getMockBrandAssets() {
    return [
      {
        id: "logo-primary",
        name: "Primary Logo",
        type: "logos",
        preview: "🏢",
        url: "/assets/logos/primary.svg",
      },
      {
        id: "logo-secondary",
        name: "Secondary Logo",
        type: "logos",
        preview: "🏪",
        url: "/assets/logos/secondary.svg",
      },
      {
        id: "icon-check",
        name: "Check Icon",
        type: "icons",
        preview: "✅",
        url: "/assets/icons/check.svg",
      },
      {
        id: "icon-star",
        name: "Star Icon",
        type: "icons",
        preview: "⭐",
        url: "/assets/icons/star.svg",
      },
      {
        id: "icon-heart",
        name: "Heart Icon",
        type: "icons",
        preview: "❤️",
        url: "/assets/icons/heart.svg",
      },
      {
        id: "hero-image",
        name: "Hero Background",
        type: "images",
        preview: "🖼️",
        url: "/assets/images/hero.jpg",
      },
      {
        id: "product-shot",
        name: "Product Photo",
        type: "images",
        preview: "📱",
        url: "/assets/images/product.jpg",
      },
      {
        id: "team-photo",
        name: "Team Photo",
        type: "images",
        preview: "👥",
        url: "/assets/images/team.jpg",
      },
    ]
  }

  // Utility methods
  isColorApproved(color, brandProfile) {
    const allApprovedColors = [
      ...(brandProfile.colors?.primary || []),
      ...(brandProfile.colors?.secondary || []),
      ...(brandProfile.colors?.neutral || []),
    ]

    return allApprovedColors.some((approvedColor) => approvedColor.toLowerCase() === color.toLowerCase())
  }

  isFontApproved(font, brandProfile) {
    const allApprovedFonts = [...(brandProfile.fonts?.primary || []), ...(brandProfile.fonts?.secondary || [])]

    return allApprovedFonts.some((approvedFont) => font.toLowerCase().includes(approvedFont.toLowerCase()))
  }

  getClosestApprovedColor(color, brandProfile) {
    const primaryColors = brandProfile.colors?.primary || ["#0066CC"]
    return primaryColors[0] // Return first primary color as default
  }

  getHighContrastColor(backgroundColor) {
    // Simple logic: return black for light backgrounds, white for dark
    const rgb = this.hexToRgb(backgroundColor)
    if (!rgb) return "#000000"

    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000
    return brightness > 128 ? "#000000" : "#FFFFFF"
  }

  calculateContrastRatio(color1, color2) {
    const rgb1 = this.hexToRgb(color1)
    const rgb2 = this.hexToRgb(color2)

    if (!rgb1 || !rgb2) return 1

    const l1 = this.getLuminance(rgb1)
    const l2 = this.getLuminance(rgb2)

    const lighter = Math.max(l1, l2)
    const darker = Math.min(l1, l2)

    return (lighter + 0.05) / (darker + 0.05)
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: Number.parseInt(result[1], 16),
          g: Number.parseInt(result[2], 16),
          b: Number.parseInt(result[3], 16),
        }
      : null
  }

  getLuminance(rgb) {
    const { r, g, b } = rgb
    const [rs, gs, bs] = [r, g, b].map((c) => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }

  getAccessToken() {
    // In a real implementation, this would retrieve the stored OAuth token
    return localStorage.getItem("brandguard_access_token") || "mock-token"
  }
}
