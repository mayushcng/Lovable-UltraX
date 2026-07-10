"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Clock, 
  Monitor, 
  Smartphone, 
  Search,
  Activity,
  ZapOff,
  AlertCircle
} from "lucide-react"

export default function ActiveUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({ online: 0, idle: 0, offline: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/admin/active-users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
        setStats({
          online: data.total_online,
          idle: data.total_idle,
          offline: data.total_offline,
          total: data.total
        });
      }
    } catch (err) {
      console.error("Failed to fetch active users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleKillSession = async (licenseId: string, deviceId: string) => {
    if (!confirm('Are you sure you want to kill this session? The user will be instantly logged out.')) return;
    try {
      const token = localStorage.getItem('admin_token');
      await fetch('/api/admin/licenses/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ license_id: licenseId, device_id: deviceId, action: 'remove_access' }),
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = users.filter(u => 
    (u.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.device_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.ip_address || '').includes(searchQuery)
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-[1.5rem] bg-card border border-border p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-accent/50 transition-colors duration-300">
        <div>
          <h1 className="text-3xl font-bold font-mono tracking-tight text-foreground mb-2 flex items-center gap-3">
            Active Users
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </h1>
          <p className="text-muted-foreground font-mono">
            Real-time view of users currently connected to the extension
          </p>
        </div>
        
        {/* Quick Stats */}
        <div className="flex gap-4">
          <div className="flex flex-col items-center justify-center bg-secondary/50 px-6 py-3 rounded-xl border border-border">
            <span className="text-2xl font-bold font-mono text-emerald-500">{stats.online}</span>
            <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider font-semibold">Online</span>
          </div>
          <div className="flex flex-col items-center justify-center bg-secondary/50 px-6 py-3 rounded-xl border border-border">
            <span className="text-2xl font-bold font-mono text-amber-500">{stats.idle}</span>
            <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider font-semibold">Idle</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, device ID, or IP..."
            className="w-full pl-11 pr-4 py-3.5 bg-card border border-border rounded-xl text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="bento-card overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-muted-foreground text-sm font-mono animate-pulse">Scanning network...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20 bg-secondary/50 border border-dashed border-border rounded-[1.5rem] m-4">
            <Activity className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <span className="text-sm font-mono text-muted-foreground">No active users found.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-secondary/50 text-muted-foreground font-mono font-semibold text-xs uppercase tracking-wider">
                  <th className="py-4 px-6 whitespace-nowrap">Status</th>
                  <th className="py-4 px-6">User Details</th>
                  <th className="py-4 px-6">Device & Network</th>
                  <th className="py-4 px-6">Activity</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-secondary/30 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex flex-col items-center gap-1 w-12">
                        {user.computed_status === 'online' && (
                          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                        )}
                        {user.computed_status === 'idle' && (
                          <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                        )}
                        {user.computed_status === 'offline' && (
                          <div className="w-3 h-3 rounded-full bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                        )}
                        <span className="text-[10px] font-mono font-bold uppercase mt-1 text-muted-foreground">
                          {user.computed_status}
                        </span>
                      </div>
                    </td>
                    
                    <td className="py-4 px-6">
                      <span className="font-semibold text-foreground block">{user.customer_name || 'Unknown User'}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-accent/10 text-accent border border-accent/20">
                          {user.plan_name || 'N/A'}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground/60 font-mono block mt-1" title={user.license_id}>
                        Lic: {user.license_id.slice(0, 8)}…
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-foreground font-mono text-xs">
                        {user.os_platform?.includes('Mac') ? <Monitor className="w-3.5 h-3.5 text-muted-foreground" /> : <Monitor className="w-3.5 h-3.5 text-muted-foreground" />}
                        {user.os_platform || 'Unknown OS'}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono mt-1 flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-secondary border border-border">v{user.extension_version || '?'}</span>
                        {user.ip_address || 'No IP'}
                      </div>
                      <div className="text-[10px] text-muted-foreground/50 font-mono mt-1 truncate max-w-[150px]" title={user.device_id}>
                        {user.device_id}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-mono text-foreground flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          Seen {user.last_seen_at ? (() => {
                            const diff = Math.floor((new Date().getTime() - new Date(user.last_seen_at).getTime()) / 60000);
                            if (diff < 1) return 'just now';
                            if (diff < 60) return `${diff}m ago`;
                            return `${Math.floor(diff/60)}h ago`;
                          })() : 'never'}
                        </span>
                        {user.current_project_url && (
                          <a href={user.current_project_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono text-accent hover:underline truncate max-w-[200px] inline-block">
                            {user.current_project_url.replace('https://lovable.dev/projects/', '')}
                          </a>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleKillSession(user.license_id, user.device_id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary border border-border rounded-lg text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-all hover-lift text-xs font-mono font-bold uppercase"
                        >
                          <ZapOff className="w-3.5 h-3.5" /> Kill Session
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
