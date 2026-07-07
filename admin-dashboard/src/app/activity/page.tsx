"use client"

import { Activity } from "lucide-react"

export default function ActivityPage() {
  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      <div className="relative overflow-hidden rounded-[1.5rem] bg-card border border-border p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-accent/50 transition-colors duration-300">
        <div>
          <h1 className="text-3xl font-bold font-mono tracking-tight text-foreground mb-2">Activity Log</h1>
          <p className="text-muted-foreground font-mono">Monitor system and user activity</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-32 text-center bento-card">
        <Activity className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold font-mono text-foreground mb-2">No Recent Activity</h2>
        <p className="text-muted-foreground font-mono text-sm max-w-sm">Activity logging is currently being set up. Check back later for real-time updates.</p>
      </div>
    </div>
  )
}
