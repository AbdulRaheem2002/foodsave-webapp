import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Store,
  Clock,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Mail,
  RefreshCw,
  MapPin,
  Phone,
  Users,
  AlertCircle,
} from 'lucide-react';
import type { AdminOverview, AdminPartnerLead, AdminRetailerRecord } from '../types';
import {
  fetchAdminOverviewApi,
  updateAdminRetailerStatusApi,
  deleteAdminRetailerApi,
  updateAdminLeadStatusApi,
} from '../services/api';

function toWhatsAppHref(rawPhone: string, message: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  const intl = digits.startsWith('0') ? `92${digits.slice(1)}` : digits.startsWith('92') ? digits : `92${digits}`;
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
}

export const AdminDashboard: React.FC = () => {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [activeSection, setActiveSection] = useState<'pending' | 'leads' | 'approved'>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAdminOverviewApi();
      setOverview(data);
    } catch (err: any) {
      setError(err?.message || 'Could not load founder admin data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const handleToggleStoreApproval = async (store: AdminRetailerRecord, approve: boolean) => {
    setBusyId(store.id);
    setError(null);
    try {
      await updateAdminRetailerStatusApi(store.id, approve);
      await loadOverview();
    } catch (err: any) {
      setError(err?.message || 'Failed to update store approval.');
    } finally {
      setBusyId(null);
    }
  };

  const handleRejectStore = async (store: AdminRetailerRecord) => {
    setBusyId(store.id);
    setError(null);
    try {
      await deleteAdminRetailerApi(store.id);
      await loadOverview();
    } catch (err: any) {
      setError(err?.message || 'Failed to remove store.');
    } finally {
      setBusyId(null);
    }
  };

  const handleLeadStatus = async (lead: AdminPartnerLead, status: AdminPartnerLead['status']) => {
    setBusyId(lead.id);
    setError(null);
    try {
      await updateAdminLeadStatusApi(lead.id, status);
      await loadOverview();
    } catch (err: any) {
      setError(err?.message || 'Failed to update lead status.');
    } finally {
      setBusyId(null);
    }
  };

  const stats = overview?.stats || {
    pendingRetailersCount: 0,
    approvedRetailersCount: 0,
    partnerLeadsCount: 0,
    activeDealsCount: 0,
  };

  return (
    <div className="max-w-6xl mx-auto py-4 space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white border border-[#E7E2D8] rounded-3xl p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="size-12 rounded-2xl bg-[#1B4332] text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#f37021]">
              Founder Control Room
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#171916] tracking-tight">
              Bakery Approvals &amp; Partner Leads
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Approve bakeries in one tap and send instant WhatsApp or email confirmation.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadOverview}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#F6F2EA] hover:bg-[#EDE6D8] border border-[#E5DFD3] text-xs font-bold text-[#171916] transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-[#E7E2D8] rounded-2xl p-4">
          <span className="text-[11px] font-bold text-stone-500 block">Pending Stores</span>
          <span className="text-2xl font-extrabold text-[#f37021]">{stats.pendingRetailersCount}</span>
        </div>
        <div className="bg-white border border-[#E7E2D8] rounded-2xl p-4">
          <span className="text-[11px] font-bold text-stone-500 block">Approved Stores</span>
          <span className="text-2xl font-extrabold text-[#1B4332]">{stats.approvedRetailersCount}</span>
        </div>
        <div className="bg-white border border-[#E7E2D8] rounded-2xl p-4">
          <span className="text-[11px] font-bold text-stone-500 block">/partner Inquiries</span>
          <span className="text-2xl font-extrabold text-[#171916]">{stats.partnerLeadsCount}</span>
        </div>
        <div className="bg-white border border-[#E7E2D8] rounded-2xl p-4">
          <span className="text-[11px] font-bold text-stone-500 block">Active Live Deals</span>
          <span className="text-2xl font-extrabold text-[#2e7d32]">{stats.activeDealsCount}</span>
        </div>
      </div>

      {/* Section Switch Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveSection('pending')}
          className={`px-4 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSection === 'pending'
              ? 'bg-[#1B4332] text-white border-[#1B4332]'
              : 'bg-white text-stone-700 border-[#E5DFD3] hover:bg-stone-50'
          }`}
        >
          <Clock className="size-3.5" />
          <span>Pending Approval ({overview?.pendingRetailers.length ?? 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('leads')}
          className={`px-4 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSection === 'leads'
              ? 'bg-[#1B4332] text-white border-[#1B4332]'
              : 'bg-white text-stone-700 border-[#E5DFD3] hover:bg-stone-50'
          }`}
        >
          <Users className="size-3.5" />
          <span>/partner Leads ({overview?.partnerLeads.length ?? 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('approved')}
          className={`px-4 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSection === 'approved'
              ? 'bg-[#1B4332] text-white border-[#1B4332]'
              : 'bg-white text-stone-700 border-[#E5DFD3] hover:bg-stone-50'
          }`}
        >
          <Store className="size-3.5" />
          <span>Approved Bakeries ({overview?.approvedRetailers.length ?? 0})</span>
        </button>
      </div>

      {/* Section Body */}
      {isLoading && !overview ? (
        <div className="bg-white border border-[#E7E2D8] rounded-3xl p-10 text-center text-xs text-stone-500 font-medium">
          Loading Founder Dashboard...
        </div>
      ) : activeSection === 'pending' ? (
        <div className="space-y-3">
          {!overview?.pendingRetailers.length ? (
            <div className="bg-white border border-[#E7E2D8] rounded-3xl p-10 text-center space-y-2">
              <CheckCircle2 className="size-8 text-[#2e7d32] mx-auto" />
              <p className="text-sm font-bold text-stone-900">All Store Applications Reviewed</p>
              <p className="text-xs text-stone-500">
                When a new bakery creates a store account, it appears here for your approval before accessing Store POS.
              </p>
            </div>
          ) : (
            overview.pendingRetailers.map((store) => {
              const approvalMsg = `Assalam-o-Alaikum ${store.ownerName || ''}! Your BiteHour bakery account for ${store.name} (${store.sector || store.city}) is now APPROVED. Sign in at https://foodsave-webapp.vercel.app/merchant to post tonight's closing-hour deals!`;
              const mailHref = store.ownerEmail
                ? `mailto:${store.ownerEmail}?subject=${encodeURIComponent(
                    `BiteHour Approved: ${store.name}`
                  )}&body=${encodeURIComponent(approvalMsg)}`
                : null;

              return (
                <div
                  key={store.id}
                  className="bg-white border border-[#E7E2D8] rounded-3xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#fff3e0] text-[#c2410c] border border-[#fed7aa] text-[10px] font-black uppercase">
                        Pending Review
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-bold uppercase">
                        {store.category}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-stone-900">{store.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600 font-medium">
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3.5 text-[#f37021]" />
                        {store.sector ? `${store.sector}, ` : ''}
                        {store.address}, {store.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="size-3.5 text-[#1B4332]" />
                        {store.contactPhone}
                      </span>
                      {store.ownerEmail && <span>{store.ownerEmail}</span>}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={busyId === store.id}
                      onClick={() => handleToggleStoreApproval(store, true)}
                      className="px-4 py-2 rounded-full bg-[#1B4332] hover:bg-[#133326] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="size-3.5" />
                      <span>Approve Store</span>
                    </button>

                    {store.contactPhone && (
                      <a
                        href={toWhatsAppHref(store.contactPhone, approvalMsg)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-full bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#15803d] border border-[#25D366]/40 text-xs font-bold flex items-center gap-1.5"
                      >
                        <MessageCircle className="size-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    )}

                    {mailHref && (
                      <a
                        href={mailHref}
                        className="px-3.5 py-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1.5"
                      >
                        <Mail className="size-3.5" />
                        <span>Email</span>
                      </a>
                    )}

                    <button
                      type="button"
                      disabled={busyId === store.id}
                      onClick={() => handleRejectStore(store)}
                      className="px-3.5 py-2 rounded-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <XCircle className="size-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : activeSection === 'leads' ? (
        <div className="space-y-3">
          {!overview?.partnerLeads.length ? (
            <div className="bg-white border border-[#E7E2D8] rounded-3xl p-10 text-center space-y-2">
              <Users className="size-8 text-stone-400 mx-auto" />
              <p className="text-sm font-bold text-stone-900">No /partner Inquiries Yet</p>
              <p className="text-xs text-stone-500">
                Bakeries submitting the 30-second inquiry form on For Bakeries appear here.
              </p>
            </div>
          ) : (
            overview.partnerLeads.map((lead) => {
              const outreachMsg = `Assalam-o-Alaikum ${lead.ownerName}! Thank you for applying ${lead.businessName} (${lead.sector}, ${lead.city}) to BiteHour. Reply here or register your Store POS login at https://foodsave-webapp.vercel.app/merchant so we can approve your account right away.`;
              return (
                <div
                  key={lead.id}
                  className="bg-white border border-[#E7E2D8] rounded-3xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#edf7ed] text-[#1B4332] border border-[#c8e6c9] text-[10px] font-extrabold uppercase">
                        {lead.status}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-bold uppercase">
                        {lead.businessType}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-stone-900">
                      {lead.businessName}{' '}
                      <span className="text-xs font-semibold text-stone-500">({lead.ownerName})</span>
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600 font-medium">
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3.5 text-[#f37021]" />
                        {lead.sector}, {lead.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="size-3.5 text-[#1B4332]" />
                        {lead.phone}
                      </span>
                      {lead.email && <span>{lead.email}</span>}
                    </div>
                    {lead.notes && (
                      <p className="text-xs text-stone-500 bg-[#F6F2EA] px-3 py-2 rounded-xl mt-1">
                        "{lead.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={toWhatsAppHref(lead.phone, outreachMsg)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-full bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#15803d] border border-[#25D366]/40 text-xs font-bold flex items-center gap-1.5"
                    >
                      <MessageCircle className="size-3.5" />
                      <span>WhatsApp Owner</span>
                    </a>

                    <select
                      value={lead.status}
                      disabled={busyId === lead.id}
                      onChange={(e) => handleLeadStatus(lead, e.target.value as AdminPartnerLead['status'])}
                      className="px-3 py-2 rounded-full bg-[#F6F2EA] border border-[#E5DFD3] text-xs font-bold text-stone-800 cursor-pointer"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {!overview?.approvedRetailers.length ? (
            <div className="bg-white border border-[#E7E2D8] rounded-3xl p-10 text-center space-y-2">
              <Store className="size-8 text-stone-400 mx-auto" />
              <p className="text-sm font-bold text-stone-900">No Approved Stores Yet</p>
              <p className="text-xs text-stone-500">Approved bakeries and cafés appear here.</p>
            </div>
          ) : (
            overview.approvedRetailers.map((store) => (
              <div
                key={store.id}
                className="bg-white border border-[#E7E2D8] rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#edf7ed] text-[#2e7d32] border border-[#c8e6c9] text-[10px] font-black uppercase">
                      Approved Live
                    </span>
                    <span className="text-xs text-stone-500 font-semibold uppercase">{store.category}</span>
                  </div>
                  <h3 className="text-base font-extrabold text-stone-900">{store.name}</h3>
                  <p className="text-xs text-stone-600">
                    {store.sector ? `${store.sector}, ` : ''}
                    {store.address}, {store.city} • {store.contactPhone}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={busyId === store.id}
                  onClick={() => handleToggleStoreApproval(store, false)}
                  className="px-4 py-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold self-start sm:self-auto cursor-pointer"
                >
                  Pause / Revoke
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
