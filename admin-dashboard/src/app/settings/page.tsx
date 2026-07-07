"use client"

import { Settings } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      <div className="relative overflow-hidden rounded-[1.5rem] bg-card border border-border p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-accent/50 transition-colors duration-300">
        <div>
          <h1 className="text-3xl font-bold font-mono tracking-tight text-foreground mb-2">System Settings</h1>
          <p className="text-muted-foreground font-mono">Configure dashboard preferences</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-32 text-center bento-card">
        <Settings className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold font-mono text-foreground mb-2">Settings Coming Soon</h2>
        <p className="text-muted-foreground font-mono text-sm max-w-sm">Global system configuration will be available in a future update.</p>
      </div>
    </div>
  )
}
