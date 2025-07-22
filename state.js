// State Management
// Simple state management using localStorage for persistence

export class StateManager {
  constructor() {
    this.prefix = "brandguard_"
    this.listeners = new Map()
  }

  // Get value from localStorage
  get(key) {
    try {
      const item = localStorage.getItem(this.prefix + key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error("Failed to get state:", key, error)
      return null
    }
  }

  // Set value in localStorage
  set(key, value) {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value))
      this.notifyListeners(key, value)
      return true
    } catch (error) {
      console.error("Failed to set state:", key, error)
      return false
    }
  }

  // Remove value from localStorage
  remove(key) {
    try {
      localStorage.removeItem(this.prefix + key)
      this.notifyListeners(key, null)
      return true
    } catch (error) {
      console.error("Failed to remove state:", key, error)
      return false
    }
  }

  // Clear specific key (alias for remove)
  clear(key) {
    return this.remove(key)
  }

  // Clear all BrandGuard data
  clearAll() {
    try {
      const keys = Object.keys(localStorage).filter((key) => key.startsWith(this.prefix))
      keys.forEach((key) => localStorage.removeItem(key))
      this.listeners.clear()
      return true
    } catch (error) {
      console.error("Failed to clear all state:", error)
      return false
    }
  }

  // Subscribe to state changes
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set())
    }
    this.listeners.get(key).add(callback)

    // Return unsubscribe function
    return () => {
      const keyListeners = this.listeners.get(key)
      if (keyListeners) {
        keyListeners.delete(callback)
        if (keyListeners.size === 0) {
          this.listeners.delete(key)
        }
      }
    }
  }

  // Notify listeners of state changes
  notifyListeners(key, value) {
    const keyListeners = this.listeners.get(key)
    if (keyListeners) {
      keyListeners.forEach((callback) => {
        try {
          callback(value, key)
        } catch (error) {
          console.error("State listener error:", error)
        }
      })
    }
  }

  // Get all keys with the prefix
  getAllKeys() {
    return Object.keys(localStorage)
      .filter((key) => key.startsWith(this.prefix))
      .map((key) => key.substring(this.prefix.length))
  }

  // Get all state data
  getAllState() {
    const state = {}
    this.getAllKeys().forEach((key) => {
      state[key] = this.get(key)
    })
    return state
  }

  // Import state data
  importState(stateData) {
    try {
      Object.entries(stateData).forEach(([key, value]) => {
        this.set(key, value)
      })
      return true
    } catch (error) {
      console.error("Failed to import state:", error)
      return false
    }
  }

  // Export state data
  exportState() {
    return this.getAllState()
  }
}
