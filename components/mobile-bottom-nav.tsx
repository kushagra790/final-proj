"use client";

import {
  Home,
  Heart,
  Bolt,
  Menu,
  ClipboardListIcon as ClipboardDocumentList,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MobileBottomSheet } from "@/components/mobile-bottom-sheet";

export function MobileBottomNav() {
  const pathname = usePathname();

  // Function to check if a route is active
  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(`${href}/`);

  // Main navigation items for bottom bar (limited to 4-5 for best UX)
  const mainNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Health", href: "/health-card", icon: Heart },
    { name: "Tracking", href: "/tracking", icon: ClipboardDocumentList },
    { name: "Metrics", href: "/metrics", icon: Bolt },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background z-50">
      <nav className="flex justify-around items-center h-16">
        {mainNavItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full ${
                active
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          );
        })}
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="flex flex-col items-center justify-center w-full h-full">
              <Menu className="h-5 w-5" />
              <span className="text-xs mt-1">More</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
            <MobileBottomSheet />
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}
