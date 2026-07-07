"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Key, 
  Smartphone, 
  Activity, 
  TrendingUp,
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Zap
} from "lucide-react"

export default function DashboardPage() {
  const [statsData, setStatsData] = useState<any>(null);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const res = await fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setStatsData(data.stats);
          setRecentEvents(data.recentEvents);
        }
      } catch (err) {
        console.error("Failed to fetch stats", err);
      }
    };
    fetchStats();
  }, []);

  const stats = [
    {
      title: "Total Licenses",
      value: statsData?.total || "0",
      change: "",
      trend: "up",
      icon: Key,
    },
    {
      title: "Active Devices",
      value: statsData?.devices || "0",
      change: "",
      trend: "up",
      icon: Smartphone,
    },
    {
      title: "Total Credits Saved",
      value: statsData?.credits_saved ? statsData.credits_saved.toLocaleString() : "0",
      change: "",
      trend: "up",
      icon: Zap,
    },
    {
      title: "Active Licenses",
      value: statsData?.active || "0",
      change: "",
      trend: "up",
      icon: CheckCircle,
    },
  ]

  const recentActivity = recentEvents.map((event: any) => ({
    id: event.id,
    type: "activation",
    message: `License created for ${event.customer_name || event.plan_name}`,
    license: event.id.slice(0, 8) + "...",
    time: new Date(event.created_at).toLocaleDateString(),
    icon: event.status === 'active' ? CheckCircle : AlertCircle,
    color: event.status === 'active' ? "text-emerald-500" : "text-amber-500",
    bg: event.status === 'active' ? "bg-emerald-500/10" : "bg-amber-500/10"
  }))

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-[1.5rem] bg-card border border-border p-8 shadow-sm group hover:border-accent/50 transition-colors duration-300">
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold font-mono tracking-tight text-foreground mb-2">
              Overview
            </h1>
            <p className="text-muted-foreground font-mono">
              Real-time monitoring for Lovable UltraX infrastructure
            </p>
          </div>
          <Badge variant="default" className="bg-accent/10 text-accent border border-accent/20 px-3 py-1 font-mono shadow-none">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse mr-2 inline-block"></span>
            System Operational
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="bento-card group">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium font-mono text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary group-hover:bg-accent/10 transition-colors">
                  <Icon className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono text-foreground mb-1">{stat.value}</div>
                {stat.change && (
                  <div className="flex items-center gap-1 text-xs font-mono">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    <span className="text-emerald-500 font-semibold">{stat.change}</span>
                    <span className="text-muted-foreground">vs last month</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts and Activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Activity Chart */}
        <Card className="bento-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between font-mono">
              <span className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-accent" />
                Activation Volume
              </span>
              <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                View Report <ArrowUpRight className="h-3 w-3" />
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-end justify-between gap-3 mt-4">
              {[65, 45, 80, 55, 70, 90, 75, 85, 60, 95, 70, 88].map((height, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-secondary hover:bg-accent transition-all duration-300 cursor-pointer group relative"
                  style={{ height: `${height}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background font-mono px-2 py-1 rounded text-xs whitespace-nowrap z-10 pointer-events-none">
                    {Math.floor((height / 100) * 150)}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between text-xs font-mono text-muted-foreground">
              <span>Jan</span>
              <span>Jun</span>
              <span>Dec</span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bento-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between font-mono">
              <span className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                Audit Log
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <div className="text-sm font-mono text-muted-foreground py-8 text-center">No recent activity found.</div>
              ) : recentActivity.map((activity) => {
                const Icon = activity.icon
                return (
                  <div
                    key={activity.id}
                    className="group flex gap-3 rounded-xl bg-secondary/50 p-3 hover:bg-secondary transition-all cursor-pointer border border-transparent hover:border-border"
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${activity.bg} ${activity.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className="text-sm font-semibold text-foreground truncate">{activity.message}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-muted-foreground font-mono truncate">{activity.license}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{activity.time}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Issue License", icon: Key },
          { label: "Manage Devices", icon: Smartphone },
          { label: "Security Audit", icon: ShieldAlert },
          { label: "System Config", icon: Zap },
        ].map((action, i) => {
          const Icon = action.icon
          return (
            <button
              key={i}
              className="group flex flex-col items-center gap-4 rounded-[1.5rem] bg-card border border-border p-6 hover:border-accent hover:shadow-md hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary group-hover:bg-accent/10 transition-colors duration-300">
                <Icon className="h-6 w-6 text-muted-foreground group-hover:text-accent transition-colors duration-300" />
              </div>
              <span className="text-sm font-semibold font-mono text-foreground group-hover:text-accent transition-colors duration-300">
                {action.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
