"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, Shield } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (data.success && data.token) {
        localStorage.setItem("admin_token", data.token)
        router.push("/")
      } else {
        alert(data.error || "Invalid email or password.")
      }
    } catch (err: any) {
      alert("Network error: " + (err.message || "Authentication failed."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background Accent Grid */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      
      {/* Glow Effects */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-accent/5 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-96 w-96 rounded-full bg-accent/5 blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-8 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-card border border-accent/20 shadow-2xl shadow-accent/10">
              <ShieldCheck className="h-8 w-8 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-mono tracking-tight text-foreground">Lovable<span className="text-accent">UltraX</span></h1>
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mt-1">Operations Center</p>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <Card className="bento-card animate-slide-in shadow-2xl shadow-black/50 border-border/80">
          <CardHeader className="space-y-2 pb-8">
            <CardTitle className="text-2xl text-center font-mono font-bold tracking-tight">Admin Gateway</CardTitle>
            <p className="text-center text-sm font-mono text-muted-foreground">
              Authenticate to access the infrastructure
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-bold font-mono text-muted-foreground uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@lovable.dev"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 py-6 bg-secondary/50 border-border rounded-xl focus:border-accent font-mono placeholder:text-muted-foreground/50 transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-xs font-bold font-mono text-muted-foreground uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 pr-11 py-6 bg-secondary/50 border-border rounded-xl focus:border-accent font-mono placeholder:text-muted-foreground/50 transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full h-12 text-sm font-bold font-mono gap-2 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg hover:shadow-accent/20 transition-all hover-lift mt-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Authorize Access
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Security Notice */}
            <div className="mt-8 p-4 rounded-xl bg-secondary/50 border border-border/50 group hover:border-accent/30 transition-colors">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-accent mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="text-sm font-bold font-mono text-foreground">Secure Connection</p>
                  <p className="text-xs font-mono text-muted-foreground mt-1 leading-relaxed">
                    This session is encrypted. Unauthorized access is strictly prohibited and logged.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-[10px] font-mono text-muted-foreground/60 mt-8 uppercase tracking-widest">
          © {new Date().getFullYear()} Lovable UltraX. All rights reserved.
        </p>
      </div>
    </div>
  )
}
