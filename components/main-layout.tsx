"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MessageSquareText, BarChart2, Settings, Menu, X, Home, Upload, Heart } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface MainLayoutProps {
  children: React.ReactNode
  disableNavigation?: boolean
}

export function MainLayout({ children, disableNavigation = false }: MainLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [apiKeySet, setApiKeySet] = useState(false)
  const [showNavigationWarning, setShowNavigationWarning] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)

  useEffect(() => {
    // Check if API key is set
    const apiKey = localStorage.getItem("gemini-api-key")
    setApiKeySet(!!apiKey)

    // If API key is not set and not on home page or settings page, redirect to home
    if (!apiKey && pathname !== "/" && pathname !== "/settings") {
      router.push("/")
    }
  }, [pathname, router])

  const routes = [
    { name: "Home", path: "/", icon: <Home className="h-5 w-5 mr-2" /> },
    { name: "Upload", path: "/upload", icon: <Upload className="h-5 w-5 mr-2" />, requiresApiKey: true },
    {
      name: "Chat Analysis",
      path: "/analysis",
      icon: <MessageSquareText className="h-5 w-5 mr-2" />,
      requiresApiKey: true,
    },
    {
      name: "Relationship Insights",
      path: "/insights",
      icon: <Heart className="h-5 w-5 mr-2" />,
      requiresApiKey: true,
    },
    { name: "Settings", path: "/settings", icon: <Settings className="h-5 w-5 mr-2" /> },
  ]

  const handleNavigation = (path: string) => {
    if (disableNavigation) {
      setShowNavigationWarning(true)
      setPendingNavigation(path)
      return false
    }
    return true
  }

  const confirmNavigation = () => {
    if (pendingNavigation) {
      router.push(pendingNavigation)
      setShowNavigationWarning(false)
      setPendingNavigation(null)
    }
  }

  const cancelNavigation = () => {
    setShowNavigationWarning(false)
    setPendingNavigation(null)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden hover:scale-105 transition-transform"
              onClick={() => !disableNavigation && setMobileMenuOpen(!mobileMenuOpen)}
              disabled={disableNavigation}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Link
              href="/"
              className="flex items-center gap-2 group"
              onClick={(e) => {
                if (!handleNavigation("/")) {
                  e.preventDefault()
                }
              }}
            >
              <BarChart2 className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
              <span className="font-bold text-xl hidden sm:inline-block group-hover:text-primary transition-colors">
                BondSense
              </span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            {routes.map((route) => {
              if (route.requiresApiKey && !apiKeySet) {
                return (
                  <TooltipProvider key={route.path}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex items-center text-sm font-medium text-muted-foreground opacity-50 cursor-not-allowed">
                          {route.icon}
                          {route.name}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>API key required</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              }

              return (
                <Link
                  key={route.path}
                  href={route.requiresApiKey && !apiKeySet ? "#" : route.path}
                  className={`flex items-center text-sm font-medium transition-colors hover:text-primary hover:scale-105 transition-all ${
                    pathname === route.path ? "text-primary" : "text-muted-foreground"
                  } ${route.requiresApiKey && !apiKeySet ? "pointer-events-none opacity-50" : ""} ${
                    disableNavigation ? "pointer-events-none opacity-70" : ""
                  }`}
                  onClick={(e) => {
                    if (route.requiresApiKey && !apiKeySet) {
                      e.preventDefault()
                    } else if (!handleNavigation(route.path)) {
                      e.preventDefault()
                    }
                  }}
                >
                  {route.icon}
                  {route.name}
                </Link>
              )
            })}
          </nav>
          <div className="flex items-center gap-2">{/* Dark mode toggle removed */}</div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-30 bg-background md:hidden animate-fade-in">
          <nav className="container grid gap-2 py-4">
            {routes.map((route) => (
              <Link
                key={route.path}
                href={route.requiresApiKey && !apiKeySet ? "#" : route.path}
                className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:scale-105 transition-all ${
                  pathname === route.path ? "bg-accent" : ""
                } ${route.requiresApiKey && !apiKeySet ? "pointer-events-none opacity-50" : ""} ${
                  disableNavigation ? "pointer-events-none opacity-70" : ""
                }`}
                onClick={(e) => {
                  if (route.requiresApiKey && !apiKeySet) {
                    e.preventDefault()
                  } else if (!handleNavigation(route.path)) {
                    e.preventDefault()
                  } else {
                    setMobileMenuOpen(false)
                  }
                }}
              >
                {route.icon}
                {route.name}
                {route.requiresApiKey && !apiKeySet && (
                  <span className="ml-auto text-xs text-muted-foreground">API key required</span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 container py-6 animate-fade-in">{children}</main>

      {/* Footer */}
      <footer className="border-t py-4 bg-background">
        <div className="container flex flex-col sm:flex-row items-center justify-between text-sm text-muted-foreground">
          <p>© 2025 BondSense. All rights reserved.</p>
          <div className="flex items-center gap-4 mt-2 sm:mt-0">
            <Link
              href="/privacy"
              className="hover:underline hover:text-primary transition-colors"
              onClick={(e) => {
                if (disableNavigation) {
                  e.preventDefault()
                  setShowNavigationWarning(true)
                  setPendingNavigation("/privacy")
                }
              }}
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:underline hover:text-primary transition-colors"
              onClick={(e) => {
                if (disableNavigation) {
                  e.preventDefault()
                  setShowNavigationWarning(true)
                  setPendingNavigation("/terms")
                }
              }}
            >
              Terms
            </Link>
            <Link
              href="/contact"
              className="hover:underline hover:text-primary transition-colors"
              onClick={(e) => {
                if (disableNavigation) {
                  e.preventDefault()
                  setShowNavigationWarning(true)
                  setPendingNavigation("/contact")
                }
              }}
            >
              Contact
            </Link>
          </div>
        </div>
      </footer>

      {/* Navigation warning dialog */}
      <Dialog open={showNavigationWarning} onOpenChange={setShowNavigationWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Files are being processed</DialogTitle>
            <DialogDescription>
              Navigating away from this page will cancel the current file processing. Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-4 mt-4">
            <Button variant="outline" onClick={cancelNavigation}>
              Stay on this page
            </Button>
            <Button variant="destructive" onClick={confirmNavigation}>
              Leave anyway
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
