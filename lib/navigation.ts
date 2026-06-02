import {
  Download,
  Heart,
  History,
  Home,
  Settings
} from "lucide-react";

export const navigationItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/history", label: "History", icon: History },
  { href: "/downloads", label: "Downloads", icon: Download },
  { href: "/settings", label: "Settings", icon: Settings }
] as const;
