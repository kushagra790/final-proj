import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

interface SiteHeaderProps {
  className?: string
}

export function SiteHeader({ className = "" }: SiteHeaderProps) {
  return (
    <header className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className}`}>
      <div className="flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl sm:text-2xl font-bold">SmartFit</span>
        </Link>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" className="md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <nav className="flex flex-col space-y-4">
              <Link href="#features" className="transition-colors hover:text-primary">
                Features
              </Link>
              <Link href="#specialties" className="transition-colors hover:text-primary">
                Specialties
              </Link>
              <Link href="#articles" className="transition-colors hover:text-primary">
                Articles
              </Link>
              <Link href="#faq" className="transition-colors hover:text-primary">
                FAQ
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link href="#features" className="transition-colors hover:text-primary">
            Features
          </Link>
          <Link href="#specialties" className="transition-colors hover:text-primary">
            Specialties
          </Link>
          <Link href="#articles" className="transition-colors hover:text-primary">
            Articles
          </Link>
          <Link href="#faq" className="transition-colors hover:text-primary">
            FAQ
          </Link>
        </nav>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <ThemeToggle />
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Sign up</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

