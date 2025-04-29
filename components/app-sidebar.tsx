"use client";

import {
  Heart,
  Home,
  Bolt,
  BarChartIcon as ChartBarSquare,
  ClipboardListIcon as ClipboardDocumentList,
  Utensils,
  CogIcon as Cog6Tooth,
  Moon,
  Sun,
  LogOut,
  GoalIcon,
  Dumbbell,
  DumbbellIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import React from "react";
export function AppSidebar() {
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();
  const { state, setOpen } = useSidebar();
  const isExpanded = state === "expanded";

  // Store previous state to prevent unnecessary localStorage updates
  const prevStateRef = React.useRef(state);

  // Initialize sidebar state from localStorage on component mount only
  useEffect(() => {
    setMounted(true);

    // Get saved state from localStorage only on initial mount
    const savedState = localStorage.getItem("sidebar-state");
    if (savedState === "expanded" || savedState === "collapsed") {
      // Only set the state if it's different from the current state
      if ((savedState === "expanded") !== (state === "expanded")) {
        setOpen(savedState === "expanded");
      }
    }
  }, []); // Empty dependency array to run only once on mount

  // Save sidebar state to localStorage only when state actually changes
  useEffect(() => {
    if (mounted && prevStateRef.current !== state) {
      localStorage.setItem("sidebar-state", state);
      prevStateRef.current = state;
    }
  }, [state, mounted]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  // Get user's name or email for display
  const userName = session?.user?.name || session?.user?.email || "User";

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    if (name.includes("@")) {
      // If it's an email, use first letter
      return name.charAt(0).toUpperCase();
    }

    // Otherwise get initials from name
    return name
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  };

  const userInitials = getInitials(userName);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Health Metrics", href: "/metrics", icon: Bolt },
    { name: "Reports", href: "/reports", icon: ChartBarSquare },
    { name: "Daily Tracking", href: "/tracking", icon: ClipboardDocumentList },
    { name: "Health Card", href: "/health-card", icon: Heart },
    { name: "Diet Plan", href: "/diet-plan", icon: Utensils },
    { name: "Exercise Plan", href: "/exercise-plan", icon: DumbbellIcon },
    { name: "Settings", href: "/settings", icon: Cog6Tooth },
  ];

  // Function to check if a route is active
  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <Sidebar className="border-r" variant="sidebar" collapsible="icon">
      <SidebarHeader className="border-b p-2">
        <div className="flex items-center justify-between w-full">
          <div
            className={`flex items-center gap-2 ${
              !isExpanded ? "mx-auto" : ""
            }`}
          >
            {isExpanded && (
              <Heart className="h-6 w-6 text-primary shrink-0 fill-primary" />
            )}
            {isExpanded && (
              <span className="font-semibold text-base">SmartFit</span>
            )}
          </div>
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 py-4">
        <SidebarMenu>
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  tooltip={!isExpanded ? item.name : undefined}
                  className={`w-full rounded-md ${
                    active
                      ? "sidebar-item-active font-medium text-primary dark:text-primary"
                      : "hover:bg-primary/30 dark:hover:bg-muted/70 transition-colors"
                  }`}
                >
                  <Link
                    href={item.href}
                    className="flex h-10 items-center gap-3 px-3"
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {isExpanded && <span>{item.name}</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip={!isExpanded ? "Profile" : undefined}
              isActive={isActive("/profile")}
              className={`w-full rounded-md ${
                isActive("/profile")
                  ? "sidebar-item-active font-medium text-primary dark:text-primary"
                  : "hover:bg-primary/30 dark:hover:bg-muted/70 transition-colors"
              }`}
            >
              <Link
                href="/profile"
                className="flex h-10 items-center gap-3 px-3"
              >
                <Avatar className="h-5 w-5 shrink-0">
                  <AvatarImage src={session?.user?.image || ""} />
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
                {isExpanded && <span className="truncate">{userName}</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              tooltip={
                !isExpanded
                  ? theme === "light"
                    ? "Dark Mode"
                    : "Light Mode"
                  : undefined
              }
              className="w-full rounded-md hover:bg-primary/30 dark:hover:bg-muted/70 transition-colors"
            >
              <div className="flex h-10 items-center gap-3 px-3">
                {mounted && (
                  <>
                    {theme === "light" ? (
                      <Sun className="h-6 w-6 shrink-0" />
                    ) : (
                      <Moon className="h-6 w-6 shrink-0" />
                    )}
                    {isExpanded && (
                      <span>
                        {theme === "light" ? "Dark Mode" : "Light Mode"}
                      </span>
                    )}
                  </>
                )}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              onClick={handleLogout}
              tooltip={!isExpanded ? "Logout" : undefined}
              className="w-full rounded-md hover:bg-primary/30 dark:hover:bg-muted/70 transition-colors"
            >
              <div className="flex h-10 items-center gap-3 px-3">
                <LogOut className="h-5 w-5 shrink-0" />
                {isExpanded && <span>Logout</span>}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
