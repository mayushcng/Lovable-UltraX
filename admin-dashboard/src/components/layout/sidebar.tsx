"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  Key, 
  Smartphone, 
  Activity, 
  Settings, 
  LogOut,
  ShieldCheck,
  Users
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Licenses", href: "/licenses", icon: Key },
  { name: "Active Users", href: "/active-users", icon: Users },
  { name: "Devices", href: "/devices", icon: Smartphone },
  { name: "Activity", href: "/activity", icon: Activity },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r border-border shadow-xl z-10">
      {/* Logo */}
      <div className="flex h-20 items-center gap-3 border-b border-border/50 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shadow-lg border border-accent/20">
          <ShieldCheck className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h1 className="text-lg font-bold font-mono text-foreground tracking-tight">Lovable<span className="text-accent">UltraX</span></h1>
          <p className="text-xs text-muted-foreground font-mono">Operations Center</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-accent/10 text-accent shadow-sm border border-accent/20"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4 transition-colors", isActive ? "text-accent" : "text-muted-foreground group-hover:text-foreground")} />
              {item.name}
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-accent status-dot active" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-border/50 p-4">
        <div className="flex items-center gap-3 rounded-lg bg-secondary p-3 border border-border/50 hover-lift">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground text-xs font-bold font-mono shadow-sm">
            LU
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold truncate text-foreground">Administrator</p>
            <p className="text-[10px] text-muted-foreground font-mono truncate">ottsathi@gmail.com</p>
          </div>
          <button className="text-muted-foreground hover:text-destructive transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
