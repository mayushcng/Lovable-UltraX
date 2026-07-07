"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Filter,
  RefreshCw,
  Smartphone,
  Monitor,
  Tablet,
  Chrome,
  MapPin,
  Clock,
  Trash2,
  Ban,
  CheckCircle,
  AlertTriangle
} from "lucide-react"
import { cn, formatDate } from "@/lib/utils"

interface Device {
  id: string
  license_id: string
  device_hash: string
  browser_fingerprint: any
  ip_address: string
  country: string
  first_seen: string
  last_seen: string
  status: string
  license_key?: string
  plan_name?: string
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")

  // Mock data - replace with real API calls
  useEffect(() => {
    const fetchDevices = async () => {
      setTimeout(() => {
        setDevices([
          {
            id: "dev_1234567890",
            license_id: "lic_abc123",
            device_hash: "hash_device_001",
            browser_fingerprint: { browser: "Chrome", os: "Windows" },
            ip_address: "192.168.1.100",
            country: "United States",
            first_seen: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            last_seen: new Date().toISOString(),
            status: "active",
            license_key: "PK-2024-XXXX",
            plan_name: "Pro"
          },
          {
            id: "dev_0987654321",
            license_id: "lic_xyz789",
            device_hash: "hash_device_002",
            browser_fingerprint: { browser: "Chrome", os: "MacOS" },
            ip_address: "10.0.0.50",
            country: "Canada",
            first_seen: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            last_seen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            status: "active",
            license_key: "PK-2024-YYYY",
            plan_name: "Enterprise"
          },
          {
            id: "dev_5555555555",
            license_id: "lic_def456",
            device_hash: "hash_device_003",
            browser_fingerprint: { browser: "Chrome", os: "Linux" },
            ip_address: "172.16.0.10",
            country: "United Kingdom",
            first_seen: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            last_seen: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: "inactive",
            license_key: "PK-2024-ZZZZ",
            plan_name: "Basic"
          },
        ])
        setLoading(false)
      }, 500)
    }

    fetchDevices()
  }, [searchQuery, selectedStatus])

  const getDeviceIcon = (fingerprint: any) => {
    if (!fingerprint) return Monitor
    const os = fingerprint.os?.toLowerCase() || ""
    if (os.includes("android") || os.includes("ios")) return Smartphone
    if (os.includes("ipad") || os.includes("tablet")) return Tablet
    return Monitor
  }

  const getStatusDetails = (lastSeen: string) => {
    const hoursSince = (Date.now() - new Date(lastSeen).getTime()) / (1000 * 60 * 60)
    if (hoursSince < 1) return { color: "emerald", label: "Active Now", bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20" }
    if (hoursSince < 24) return { color: "blue", label: "Active Today", bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20" }
    if (hoursSince < 168) return { color: "amber", label: "Inactive", bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20" }
    return { color: "destructive", label: "Offline", bg: "bg-destructive/10", text: "text-destructive", border: "border-destructive/20" }
  }

  const stats = [
    { label: "Total Devices", value: "856", icon: Smartphone, bg: "bg-accent/10", text: "text-accent" },
    { label: "Active Now", value: "324", icon: CheckCircle, bg: "bg-emerald-500/10", text: "text-emerald-500" },
    { label: "Inactive", value: "125", icon: AlertTriangle, bg: "bg-amber-500/10", text: "text-amber-500" },
    { label: "Blocked", value: "12", icon: Ban, bg: "bg-destructive/10", text: "text-destructive" },
  ]

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[1.5rem] bg-card border border-border p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-accent/50 transition-colors duration-300">
        <div>
          <h1 className="text-3xl font-bold font-mono tracking-tight text-foreground mb-2">Device Fleet</h1>
          <p className="text-muted-foreground font-mono">Monitor and manage connected endpoints</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-3 bg-secondary hover:bg-secondary/80 border border-border text-sm font-bold font-mono rounded-xl text-foreground transition-all shadow-sm hover-lift active:scale-[0.98]">
          <RefreshCw className="h-4 w-4" />
          Refresh Registry
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <Card key={i} className="bento-card group">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-mono text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold font-mono mt-1 text-foreground">{stat.value}</p>
                  </div>
                  <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl transition-colors",
                    stat.bg
                  )}>
                    <Icon className={cn("h-6 w-6 transition-transform group-hover:scale-110", stat.text)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <Card className="bento-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by device, IP, country, or license..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-all shadow-sm"
              />
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-3 bg-secondary hover:bg-secondary/80 border border-border rounded-xl text-sm font-mono font-bold transition-all shadow-sm hover-lift">
                <Filter className="h-4 w-4" />
                Filter
              </button>
            </div>
          </div>

          {/* Status Filters */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2 custom-scrollbar">
            {["all", "active", "inactive", "blocked"].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap",
                  selectedStatus === status
                    ? "bg-accent/10 text-accent border border-accent/20"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80 border border-transparent"
                )}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Device Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="h-8 w-8 animate-spin text-accent" />
            <p className="text-sm font-mono text-muted-foreground">Synchronizing registry...</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {devices.map((device) => {
            const DeviceIcon = getDeviceIcon(device.browser_fingerprint)
            const status = getStatusDetails(device.last_seen)
            
            return (
              <Card key={device.id} className="bento-card group relative overflow-hidden">
                <CardContent className="pt-6 relative z-10">
                  {/* Device Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl shadow-sm",
                      status.bg, status.border, "border"
                    )}>
                      <DeviceIcon className={cn("h-6 w-6", status.text)} />
                    </div>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button title="Block Device" className="p-2 rounded-lg bg-secondary border border-border hover:bg-amber-500/10 hover:border-amber-500/30 transition-all hover-lift">
                        <Ban className="h-4 w-4 text-amber-500" />
                      </button>
                      <button title="Delete Device" className="p-2 rounded-lg bg-secondary border border-border hover:bg-destructive/10 hover:border-destructive/30 transition-all hover-lift">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  </div>

                  {/* Device Info */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider font-mono">License Key</p>
                      <div className="flex items-center justify-between">
                        <p className="font-mono text-sm font-bold text-foreground">{device.license_key}</p>
                        <Badge variant="default" className="bg-accent/5 text-accent border border-accent/20 text-[10px] font-mono px-2 py-0.5 shadow-none">
                          {device.plan_name}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm font-mono bg-secondary/50 p-2.5 rounded-lg border border-border/50">
                      <Chrome className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-foreground truncate">
                        {device.browser_fingerprint?.browser || "Unknown"} <span className="text-muted-foreground mx-1">•</span> {device.browser_fingerprint?.os || "Unknown"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm font-mono bg-secondary/50 p-2.5 rounded-lg border border-border/50">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-foreground truncate">{device.country}</span>
                      <span className="text-muted-foreground shrink-0">({device.ip_address})</span>
                    </div>

                    <div className="pt-4 border-t border-border/50">
                      <div className="flex items-center justify-between text-xs font-mono mb-2">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Last Sync</span>
                        </div>
                        <span className={cn("font-bold", status.text)}>
                          {formatDate(device.last_seen)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-muted-foreground">First Seen</span>
                        <span className="text-foreground/70">{formatDate(device.first_seen)}</span>
                      </div>
                    </div>

                    {/* Status Indicator */}
                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "h-2 w-2 rounded-full",
                          status.color === "emerald" ? "bg-emerald-500 animate-pulse" : `bg-${status.color}-500`
                        )} />
                        <span className="text-xs font-bold font-mono text-muted-foreground">
                          {status.label}
                        </span>
                      </div>
                      <code className="text-[10px] font-mono text-muted-foreground/50 bg-secondary px-1.5 py-0.5 rounded">
                        {device.device_hash.slice(0, 8)}
                      </code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
