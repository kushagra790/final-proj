"use client";

import {
  BarChartIcon as ChartBarSquare,
  Utensils,
  CogIcon as Cog6Tooth,
  Moon,
  Sun,
  LogOut,
  UserCircle
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { useState, useEffect } from "react";

export function MobileBottomSheet() {
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  // Get user's name or email for display
  const userName = session?.user?.name || session?.user?.email || "User";

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    if (name.includes("@")) {
      return name.charAt(0).toUpperCase();
    }
    return name
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  };

  const userInitials = getInitials(userName);

  // Additional navigation items for sheet
  const additionalNavItems = [
    { name: "Reports", href: "/reports", icon: ChartBarSquare },
    { name: "Diet Plan", href: "/diet-plan", icon: Utensils },
    { name: "Settings", href: "/settings", icon: Cog6Tooth },
  ];

  // Function to check if a route is active
  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <div className="py-4 px-2">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src={session?.user?.image || ""} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold">{userName}</h2>
            <p className="text-sm text-muted-foreground">
              {session?.user?.email}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        <Link href="/profile">
          <Button 
            variant={isActive("/profile") ? "default" : "ghost"} 
            className="w-full justify-start"
          >
            <UserCircle className="mr-2 h-5 w-5" />
            Profile
          </Button>
        </Link>

        {additionalNavItems.map((item) => (
          <Link key={item.name} href={item.href}>
            <Button 
              variant={isActive(item.href) ? "default" : "ghost"} 
              className="w-full justify-start"
            >
              <item.icon className="mr-2 h-5 w-5" />
              {item.name}
            </Button>
          </Link>
        ))}
      </div>

      <Separator className="my-4" />

      <div className="grid gap-2">
        {mounted && (
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? (
              <Moon className="mr-2 h-5 w-5" />
            ) : (
              <Sun className="mr-2 h-5 w-5" />
            )}
            {theme === "light" ? "Dark Mode" : "Light Mode"}
          </Button>
        )}

        <Button
          variant="ghost"
          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );
}
