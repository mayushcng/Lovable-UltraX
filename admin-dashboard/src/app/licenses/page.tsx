'use client';

import React, { useState, useEffect } from 'react';
import AdminGuard from '../../components/AdminGuard';
import { Plus, Trash2, ShieldAlert, CheckCircle, Search, Edit2, Ban, ShieldCheck, X, Key } from 'lucide-react';

interface License {
  id: string;
  plan_name: string;
  plan?: string;
  customer_name?: string;
  customer_email?: string;
  status: string;
  max_devices: number;
  activation_count: number;
  notes: string;
  created_at: string;
  expires_at: string | null;
  admin_message?: string;
  support_url?: string;
  support_telegram?: string;
}

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  
  // Form State
  const [planName, setPlanName] = useState('pro');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [maxDevices, setMaxDevices] = useState(1);
  const [expiresAt, setExpiresAt] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('active');
  const [customDays, setCustomDays] = useState('');
  const [customMinutes, setCustomMinutes] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');

  const formatDatetimeLocal = (dateOrStr: Date | string | null) => {
    if (!dateOrStr) return '';
    const date = typeof dateOrStr === 'string' ? new Date(dateOrStr) : dateOrStr;
    if (isNaN(date.getTime())) return '';
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [adminMessage, setAdminMessage] = useState('');
  const [supportUrl, setSupportUrl] = useState('');
  const [supportTelegram, setSupportTelegram] = useState('');

  const fetchLicenses = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/api/admin/licenses?query=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLicenses(data.licenses);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, [searchQuery]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('admin_token');
      
      let parsedExpiry = null;
      if (expiresAt) {
        const d = new Date(expiresAt);
        if (!isNaN(d.getTime())) {
          parsedExpiry = d.toISOString();
        } else {
          alert('Invalid expiration date.');
          return;
        }
      }

      const res = await fetch('/api/admin/licenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan_name: planName,
          plan: planName,
          customer_name: customerName,
          customer_email: customerEmail,
          max_devices: maxDevices,
          expires_at: parsedExpiry,
          notes,
          admin_message: adminMessage,
          support_url: supportUrl,
          support_telegram: supportTelegram,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedKey(data.rawKey);
        setCreateModalOpen(false);
        setKeyModalOpen(true);
        fetchLicenses();
        // Reset form
        setPlanName('pro');
        setCustomerName('');
        setCustomerEmail('');
        setMaxDevices(1);
        setExpiresAt('');
        setNotes('');
        setAdminMessage('');
        setSupportUrl('');
        setSupportTelegram('');
      } else {
        alert(data.error || 'Failed to create license key.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Network error: ' + (err.message || 'Failed to create license key.'));
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLicense) return;

    try {
      const token = localStorage.getItem('admin_token');

      let parsedExpiry = null;
      if (expiresAt) {
        const d = new Date(expiresAt);
        if (!isNaN(d.getTime())) {
          parsedExpiry = d.toISOString();
        } else {
          alert('Invalid expiration date.');
          return;
        }
      }

      const res = await fetch('/api/admin/licenses', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: selectedLicense.id,
          plan_name: planName,
          plan: planName,
          customer_name: customerName,
          customer_email: customerEmail,
          max_devices: maxDevices,
          expires_at: parsedExpiry,
          notes,
          status,
          admin_message: adminMessage,
          support_url: supportUrl,
          support_telegram: supportTelegram,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEditModalOpen(false);
        fetchLicenses();
      } else {
        alert(data.error || 'Failed to update license details.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Network error: ' + (err.message || 'Failed to update license details.'));
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      await fetch('/api/admin/licenses', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, status }),
      });
      fetchLicenses();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveAccess = async (id: string) => {
    if (!confirm('Remove this user\'s license access? Their extension will logout within ~30 seconds.')) return;
    try {
      const token = localStorage.getItem('admin_token');
      await fetch('/api/admin/licenses/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, action: 'remove_access' }),
      });
      fetchLicenses();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetDevices = async (id: string) => {
    if (!confirm('Remove all devices for this license? User must re-activate.')) return;
    try {
      const token = localStorage.getItem('admin_token');
      await fetch('/api/admin/licenses/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, action: 'reset_devices' }),
      });
      fetchLicenses();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this license? All associated devices will be unlinked.')) return;
    try {
      const token = localStorage.getItem('admin_token');
      await fetch(`/api/admin/licenses?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchLicenses();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCustomDaysChange = (daysStr: string) => {
    setCustomDays(daysStr);
    setCustomMinutes('');
    if (!daysStr) {
      setExpiresAt('');
      return;
    }
    const days = parseInt(daysStr, 10);
    if (!isNaN(days) && days > 0) {
      const date = new Date();
      date.setDate(date.getDate() + days);
      setExpiresAt(formatDatetimeLocal(date));
    }
  };

  const handleCustomMinutesChange = (minutesStr: string) => {
    setCustomMinutes(minutesStr);
    setCustomDays('');
    if (!minutesStr) {
      setExpiresAt('');
      return;
    }
    const minutes = parseInt(minutesStr, 10);
    if (!isNaN(minutes) && minutes > 0) {
      const date = new Date();
      date.setMinutes(date.getMinutes() + minutes);
      setExpiresAt(formatDatetimeLocal(date));
    }
  };

  const openCreateModal = () => {
    setPlanName('pro');
    setCustomerName('');
    setCustomerEmail('');
    setMaxDevices(1);
    setExpiresAt('');
    setCustomDays('');
    setCustomMinutes('');
    setNotes('');
    setAdminMessage('');
    setSupportUrl('');
    setSupportTelegram('');
    setCreateModalOpen(true);
  };

  const openEditModal = (license: License) => {
    setSelectedLicense(license);
    setPlanName(license.plan_name || license.plan || 'pro');
    setCustomerName(license.customer_name || '');
    setCustomerEmail(license.customer_email || '');
    setMaxDevices(license.max_devices);
    setExpiresAt(license.expires_at ? formatDatetimeLocal(license.expires_at) : '');
    setNotes(license.notes);
    setStatus(license.status || 'active');
    setAdminMessage(license.admin_message || '');
    setSupportUrl(license.support_url || '');
    setSupportTelegram(license.support_telegram || '');
    setCustomDays('');
    setCustomMinutes('');
    setEditModalOpen(true);
  };

  return (
    <AdminGuard>
      <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="relative overflow-hidden rounded-[1.5rem] bg-card border border-border p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-accent/50 transition-colors duration-300">
          <div>
            <h1 className="text-3xl font-bold font-mono tracking-tight text-foreground mb-2">License Management</h1>
            <p className="text-muted-foreground font-mono">Create and manage license keys for your users</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-3 bg-accent hover:bg-accent/90 text-sm font-bold font-mono rounded-xl text-accent-foreground transition-all shadow-lg hover:shadow-accent/25 hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Issue License
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by license key, plan name, or notes..."
              className="w-full pl-11 pr-4 py-3.5 bg-card border border-border rounded-xl text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-20 text-muted-foreground text-sm font-mono animate-pulse">Loading licenses...</div>
        ) : licenses.length === 0 ? (
          <div className="text-center py-20 bg-secondary/50 border border-dashed border-border rounded-[1.5rem]">
            <span className="text-sm font-mono text-muted-foreground">No licenses found matching your filters.</span>
          </div>
        ) : (
          <div className="bento-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-secondary/50 text-muted-foreground font-mono font-semibold text-xs uppercase tracking-wider">
                    <th className="py-4 px-6 whitespace-nowrap">Customer / Plan</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Devices (Used/Max)</th>
                    <th className="py-4 px-6">Expires At</th>
                    <th className="py-4 px-6">Notes & Details</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {licenses.map((lic) => (
                    <tr key={lic.id} className="hover:bg-secondary/30 transition-colors group">
                      <td className="py-4 px-6">
                        <span className="font-semibold text-foreground block">{lic.customer_name || lic.notes?.split('|')[0]?.trim() || '—'}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-accent/10 text-accent border border-accent/20">
                            {lic.plan_name || lic.plan}
                          </span>
                        </div>
                        {lic.customer_email && <span className="text-xs text-muted-foreground block mt-1">{lic.customer_email}</span>}
                        <span className="text-[10px] text-muted-foreground/60 font-mono block mt-1" title={lic.id}>{lic.id.slice(0, 8)}…</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex px-2.5 py-1 rounded-full font-bold text-[10px] font-mono uppercase border ${
                          lic.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : lic.status === 'suspended'
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            : 'bg-destructive/10 text-destructive border-destructive/20'
                        }`}>
                          {lic.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono text-foreground font-medium">
                        {lic.activation_count} <span className="text-muted-foreground">/ {lic.max_devices}</span>
                      </td>
                      <td className="py-4 px-6 text-muted-foreground font-mono text-xs">
                        {lic.expires_at ? new Date(lic.expires_at).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="py-4 px-6 text-muted-foreground max-w-xs" title={lic.notes}>
                        <div className="truncate font-medium">{lic.notes || '—'}</div>
                        {lic.admin_message && (
                          <div className="text-[10px] font-mono text-amber-500 font-semibold mt-1 truncate bg-amber-500/10 px-1.5 py-0.5 rounded w-fit" title={lic.admin_message}>
                            📢 {lic.admin_message}
                          </div>
                        )}
                        {lic.support_url && (
                          <div className="text-[10px] font-mono text-blue-500 font-semibold mt-1 truncate bg-blue-500/10 px-1.5 py-0.5 rounded w-fit" title={lic.support_url}>
                            💬 {lic.support_url}
                          </div>
                        )}
                        {lic.support_telegram && (
                          <div className="text-[10px] font-mono text-sky-500 font-semibold mt-1 truncate bg-sky-500/10 px-1.5 py-0.5 rounded w-fit" title={lic.support_telegram}>
                            ✈️ {lic.support_telegram}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          {lic.status === 'active' ? (
                            <button
                              onClick={() => handleStatusUpdate(lic.id, 'suspended')}
                              title="Suspend Key"
                              className="p-2 bg-secondary border border-border rounded-lg text-amber-500 hover:bg-amber-500/10 hover:border-amber-500/30 transition-all hover-lift"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusUpdate(lic.id, 'active')}
                              title="Activate Key"
                              className="p-2 bg-secondary border border-border rounded-lg text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all hover-lift"
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleResetDevices(lic.id)}
                            title="Reset All Devices"
                            className="p-2 bg-secondary border border-border rounded-lg text-amber-500 hover:bg-amber-500/10 hover:border-amber-500/30 transition-all hover-lift"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveAccess(lic.id)}
                            title="Remove User Access"
                            className="p-2 bg-secondary border border-border rounded-lg text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-all hover-lift"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(lic)}
                            title="Edit Info"
                            className="p-2 bg-secondary border border-border rounded-lg text-blue-500 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all hover-lift"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(lic.id)}
                            title="Delete Key"
                            className="p-2 bg-secondary border border-border rounded-lg text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-all hover-lift"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: Create/Edit License Form Overlays */}
        {createModalOpen && (
          <div className="fixed inset-0 bg-background/80 backdrop-filter backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="w-full max-w-md bg-card border border-border shadow-2xl rounded-[1.5rem] p-6 my-8 max-h-[85vh] overflow-y-auto custom-scrollbar animate-slide-in">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-foreground font-mono text-lg">Issue New License</h3>
                <button onClick={() => setCreateModalOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-secondary">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-5 text-sm font-mono">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Customer Name</label>
                    <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="John Doe" className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-muted-foreground/50" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Customer Email</label>
                    <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="john@example.com" className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-muted-foreground/50" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Plan Name</label>
                      <input type="text" value={planName} onChange={(e) => setPlanName(e.target.value)} required className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Max Devices</label>
                      <input type="number" value={maxDevices} onChange={(e) => setMaxDevices(parseInt(e.target.value))} required min={1} className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 border-t border-border/50 pt-4 mt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Valid Days</label>
                      <input type="number" value={customDays} onChange={(e) => handleCustomDaysChange(e.target.value)} placeholder="E.g. 30" min={1} className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Valid Mins</label>
                      <input type="number" value={customMinutes} onChange={(e) => handleCustomMinutesChange(e.target.value)} placeholder="E.g. 60" min={1} className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Exact Expiry Date</label>
                    <input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all" />
                  </div>

                  <div className="border-t border-border/50 pt-4 mt-2 space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Global Broadcast Message</label>
                      <input type="text" value={adminMessage} onChange={(e) => setAdminMessage(e.target.value)} placeholder="Alert for this user..." className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Custom Support URL</label>
                      <input type="url" value={supportUrl} onChange={(e) => setSupportUrl(e.target.value)} placeholder="https://..." className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Support Telegram</label>
                      <input type="text" value={supportTelegram} onChange={(e) => setSupportTelegram(e.target.value)} placeholder="@username" className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Internal Admin Notes</label>
                      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Private notes..." className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all resize-none" />
                    </div>
                  </div>
                </div>

                <button type="submit" className="w-full mt-6 py-3.5 bg-accent hover:bg-accent/90 text-accent-foreground font-bold font-mono rounded-xl transition-all shadow-lg hover:-translate-y-0.5">
                  Generate License Key
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit License (Similar to Create) */}
        {editModalOpen && (
          <div className="fixed inset-0 bg-background/80 backdrop-filter backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="w-full max-w-md bg-card border border-border shadow-2xl rounded-[1.5rem] p-6 my-8 max-h-[85vh] overflow-y-auto custom-scrollbar animate-slide-in">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-foreground font-mono text-lg">Edit License</h3>
                <button onClick={() => setEditModalOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-secondary">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleEdit} className="space-y-5 text-sm font-mono">
                <div className="space-y-4">
                  {/* Shared fields with Create Modal (styled identically) */}
                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Customer Name</label>
                    <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:border-accent transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Customer Email</label>
                    <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:border-accent transition-all" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 border-t border-border/50 pt-4 mt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Plan Name</label>
                      <input type="text" value={planName} onChange={(e) => setPlanName(e.target.value)} required className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:border-accent transition-all" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Status</label>
                      <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:border-accent transition-all">
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="revoked">Revoked</option>
                        <option value="expired">Expired</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Max Devices</label>
                      <input type="number" value={maxDevices} onChange={(e) => setMaxDevices(parseInt(e.target.value))} required min={1} className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:border-accent transition-all" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Add Days</label>
                      <input type="number" value={customDays} onChange={(e) => handleCustomDaysChange(e.target.value)} placeholder="E.g. 30" min={1} className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:border-accent transition-all" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Exact Expiry Date</label>
                    <input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:border-accent transition-all" />
                  </div>

                  <div className="border-t border-border/50 pt-4 mt-2 space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Internal Admin Notes</label>
                      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:border-accent transition-all resize-none" />
                    </div>
                  </div>
                </div>

                <button type="submit" className="w-full mt-6 py-3.5 bg-accent hover:bg-accent/90 text-accent-foreground font-bold font-mono rounded-xl transition-all shadow-lg hover:-translate-y-0.5">
                  Save Changes
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Display Generated Key */}
        {keyModalOpen && (
          <div className="fixed inset-0 bg-background/80 backdrop-filter backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="w-full max-w-md bg-card border border-border rounded-[1.5rem] p-8 shadow-2xl my-8 animate-slide-in">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <Key className="w-8 h-8 text-emerald-500" />
                </div>
              </div>
              <h3 className="font-bold text-foreground font-mono text-xl text-center">License Created</h3>
              <p className="text-xs text-muted-foreground text-center mt-2 font-mono">
                Copy this key now. It is encrypted in our database and cannot be retrieved later.
              </p>
              
              <div className="my-8 p-6 bg-secondary border border-border rounded-xl text-center shadow-inner group hover:border-accent/50 transition-colors cursor-text">
                <span className="font-mono font-bold text-xl text-foreground select-all tracking-wider">{generatedKey}</span>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedKey);
                    alert('Copied to clipboard!');
                  }}
                  className="flex-1 py-3 bg-secondary border border-border hover:bg-secondary/80 font-bold font-mono rounded-xl text-sm transition-all hover-lift"
                >
                  Copy Key
                </button>
                <button
                  onClick={() => setKeyModalOpen(false)}
                  className="flex-1 py-3 bg-accent hover:bg-accent/90 font-bold font-mono rounded-xl text-sm text-accent-foreground transition-all hover-lift shadow-lg hover:shadow-accent/25"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminGuard>
  );
}
