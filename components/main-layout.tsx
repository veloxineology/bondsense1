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
  const [showNavigationWarning, setShowNavigationWarning] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)

  const routes = [
    { name: "Home", path: "/", icon: <Home className="h-5 w-5 mr-2" /> },
    { name: "Upload", path: "/upload", icon: <Upload className="h-5 w-5 mr-2" /> },
    {
      name: "Chat Analysis",
      path: "/analysis",
      icon: <MessageSquareText className="h-5 w-5 mr-2" />,
    },
    {
      name: "Relationship Insights",
      path: "/insights",
      icon: <Heart className="h-5 w-5 mr-2" />,
    },
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
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="mr-4 hidden md:flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="hidden font-bold sm:inline-block">Chat Analysis</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            {routes.map((route) => (
              <Link
                key={route.path}
                href={route.path}
                className={`flex items-center text-sm font-medium transition-colors hover:text-primary hover:scale-105 transition-all ${
                  pathname === route.path ? "text-primary" : "text-muted-foreground"
                } ${disableNavigation ? "pointer-events-none opacity-70" : ""}`}
                onClick={(e) => {
                  if (!handleNavigation(route.path)) {
                    e.preventDefault()
                  }
                }}
              >
                {route.icon}
                {route.name}
              </Link>
            ))}
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
                href={route.path}
                className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:scale-105 transition-all ${
                  pathname === route.path ? "bg-accent" : ""
                } ${disableNavigation ? "pointer-events-none opacity-70" : ""}`}
                onClick={(e) => {
                  if (!handleNavigation(route.path)) {
                    e.preventDefault()
                  } else {
                    setMobileMenuOpen(false)
                  }
                }}
              >
                {route.icon}
                {route.name}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 container py-6 animate-fade-in">{children}</main>

      {/* Footer */}
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built with ❤️ for better relationships
          </p>
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
