"use client"

import type React from "react"
import { Inter as FontSans } from "next/font/google"
import "@/styles/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AppSidebar } from "@/components/app-sidebar"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import ProtectedRoute from "@/components/ProtectedRoute"
import { SessionProvider } from "@/components/SessionProvider"
import { cn } from "@/lib/utils"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"

const fontSans = FontSans({ subsets: ["latin"], variable: "--font-sans" })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isPublicRoute = ["/", "/login", "/signup", "/initial-health-form"].includes(pathname || "")
  
  // Load the initial sidebar state from localStorage during client rendering
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen w-full bg-background font-sans antialiased", fontSans.variable)}>
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            {isPublicRoute ? (
              <main className="min-h-screen w-full max-w-full">{children}</main>
            ) : (
              <SidebarProvider defaultOpen={true}>
                <div className="flex w-full h-screen">
                  {/* Desktop Sidebar - hidden on mobile */}
                  <div className="hidden md:block">
                    <AppSidebar />
                  </div>
                  <SidebarInset className="flex-grow overflow-auto">
                    <ProtectedRoute>
                      <main className="w-full p-6 pb-20 md:pb-6">{children}</main>
                      {/* Mobile Bottom Navigation - only visible on mobile */}
                      <MobileBottomNav />
                    </ProtectedRoute>
                  </SidebarInset>
                </div>
              </SidebarProvider>
            )}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
