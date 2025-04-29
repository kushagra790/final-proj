import { useState, useEffect } from 'react'

export function useSidebarState() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  useEffect(() => {
    // Load initial state from localStorage
    const savedState = localStorage.getItem("sidebar-collapsed")
    if (savedState !== null) {
      setIsCollapsed(savedState === "true")
    }
    
    // Function to handle changes from other components
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "sidebar-collapsed") {
        setIsCollapsed(event.newValue === "true")
      }
    }
    
    // Custom event for direct communication between components
    const handleCustomEvent = (event: CustomEvent<{ collapsed: boolean }>) => {
      setIsCollapsed(event.detail.collapsed)
    }
    
    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("sidebar-state-change" as any, handleCustomEvent as EventListener)
    
    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("sidebar-state-change" as any, handleCustomEvent as EventListener)
    }
  }, [])
  
  const toggleSidebar = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem("sidebar-collapsed", newState.toString())
    
    // Dispatch custom event to notify other components
    const customEvent = new CustomEvent("sidebar-state-change", {
      detail: { collapsed: newState }
    })
    window.dispatchEvent(customEvent)
  }
  
  return { isCollapsed, toggleSidebar }
}
