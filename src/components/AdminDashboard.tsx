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
  AlertTriangle,
  X,
  Trash2,
  BellRing,
  Smartphone,
  TrendingUp,
  PackageCheck,
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { OrdersHistoryPanel } from './OrdersHistoryPanel';
import type {
  AdminDropSubscriber,
  AdminOverview,
  AdminPartnerLead,
  AdminPushSubscriber,
  AdminRetailerRecord,
} from '../types';
import {
  fetchAdminOverviewApi,
  updateAdminRetailerStatusApi,
  deleteAdminRetailerApi,
  updateAdminLeadStatusApi,
  deleteAdminDropSubscriberApi,
  deleteAdminPushSubscriberApi,
} from '../services/api';

function toWhatsAppHref(rawPhone: string, message: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  const intl = digits.startsWith('0') ? `92${digits.slice(1)}` : digits.startsWith('92') ? digits : `92${digits}`;
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
}

type ConfirmAction =
  | { kind: 'approve-store'; store: AdminRetailerRecord }
  | { kind: 'revoke-store'; store: AdminRetailerRecord }
  | { kind: 'delete-store'; store: AdminRetailerRecord }
  | { kind: 'lead-status'; lead: AdminPartnerLead; nextStatus: AdminPartnerLead['status'] }
  | { kind: 'delete-subscriber'; subscriber: AdminDropSubscriber }
  | { kind: 'delete-push-subscriber'; pushSub: AdminPushSubscriber };

interface AlertNotice {
  type: 'success' | 'warning';
  title: string;
  message: string;
  whatsappHref?: string;
}

export const AdminDashboard: React.FC = () => {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [activeSection, setActiveSection] = useState<'pending' | 'leads' | 'subscribers' | 'sales' | 'approved'>('pending');
  const [selectedSalesStoreId, setSelectedSalesStoreId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [alertNotice, setAlertNotice] = useState<AlertNotice | null>(null);

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

  const appOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  const buildStoreApprovalMsg = (store: AdminRetailerRecord) =>
    `Assalam-o-Alaikum ${store.ownerName || ''}! Your BiteHour partner account for ${store.name} (${store.sector || store.city}) is now APPROVED. Sign in at ${appOrigin}/merchant to post tonight's closing-hour deals!`;

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;
    const action = confirmAction;

    if (action.kind === 'approve-store' || action.kind === 'revoke-store') {
      const approve = action.kind === 'approve-store';
      setBusyId(action.store.id);
      setError(null);
      try {
        await updateAdminRetailerStatusApi(action.store.id, approve);
        await loadOverview();
        setAlertNotice({
          type: approve ? 'success' : 'warning',
          title: approve ? `${action.store.name} Approved` : `${action.store.name} Moved to Pending`,
          message: approve
            ? 'Store POS access is unlocked. Send them a WhatsApp or email confirmation below.'
            : 'Store POS access has been paused until re-approved.',
          whatsappHref:
            approve && action.store.contactPhone
              ? toWhatsAppHref(action.store.contactPhone, buildStoreApprovalMsg(action.store))
              : undefined,
        });
      } catch (err: any) {
        setError(err?.message || 'Failed to update store approval.');
      } finally {
        setBusyId(null);
        setConfirmAction(null);
      }
      return;
    }

    if (action.kind === 'delete-store') {
      setBusyId(action.store.id);
      setError(null);
      try {
        await deleteAdminRetailerApi(action.store.id);
        await loadOverview();
        setAlertNotice({
          type: 'warning',
          title: `${action.store.name} Removed`,
          message: 'Store application and any linked listings were permanently deleted.',
        });
      } catch (err: any) {
        setError(err?.message || 'Failed to remove store.');
      } finally {
        setBusyId(null);
        setConfirmAction(null);
      }
      return;
    }

    if (action.kind === 'lead-status') {
      setBusyId(action.lead.id);
      setError(null);
      try {
        await updateAdminLeadStatusApi(action.lead.id, action.nextStatus);
        await loadOverview();
        setAlertNotice({
          type: action.nextStatus === 'rejected' ? 'warning' : 'success',
          title: `Lead Marked "${action.nextStatus.toUpperCase()}"`,
          message: `${action.lead.businessName} status updated cleanly.`,
        });
      } catch (err: any) {
        setError(err?.message || 'Failed to update lead status.');
      } finally {
        setBusyId(null);
        setConfirmAction(null);
      }
      return;
    }

    if (action.kind === 'delete-subscriber') {
      setBusyId(action.subscriber.id);
      setError(null);
      try {
        await deleteAdminDropSubscriberApi(action.subscriber.id);
        await loadOverview();
        setAlertNotice({
          type: 'warning',
          title: 'Drop Subscriber Removed',
          message: `${action.subscriber.phone} (${action.subscriber.sector}) removed from evening drop alerts.`,
        });
      } catch (err: any) {
        setError(err?.message || 'Failed to remove subscriber.');
      } finally {
        setBusyId(null);
        setConfirmAction(null);
      }
      return;
    }

    if (action.kind === 'delete-push-subscriber') {
      setBusyId(action.pushSub.id);
      setError(null);
      try {
        await deleteAdminPushSubscriberApi(action.pushSub.id);
        await loadOverview();
        setAlertNotice({
          type: 'warning',
          title: 'Push Device Removed',
          message: `${action.pushSub.deviceType} subscription (${action.pushSub.sectors.join(', ')}) was removed.`,
        });
      } catch (err: any) {
        setError(err?.message || 'Failed to remove push subscription.');
      } finally {
        setBusyId(null);
        setConfirmAction(null);
      }
    }
  };

  const handleLeadSelect = async (lead: AdminPartnerLead, nextStatus: AdminPartnerLead['status']) => {
    if (nextStatus === 'rejected' || nextStatus === 'approved') {
      setConfirmAction({ kind: 'lead-status', lead, nextStatus });
      return;
    }

    setBusyId(lead.id);
    setError(null);
    try {
      await updateAdminLeadStatusApi(lead.id, nextStatus);
      await loadOverview();
      setAlertNotice({
        type: 'success',
        title: `Lead Marked "${nextStatus.toUpperCase()}"`,
        message: `${lead.businessName} inquiry status saved.`,
      });
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
    dropSubscribersCount: 0,
    pushSubscribersCount: 0,
    activeDealsCount: 0,
  };

  const platformSales = overview?.platformSales || {
    totalCollectedRevenuePkr: 0,
    totalPendingRevenuePkr: 0,
    totalGrossRevenuePkr: 0,
    totalOrdersCount: 0,
    collectedOrdersCount: 0,
    pendingOrdersCount: 0,
    cancelledOrNoShowCount: 0,
    totalUnitsSold: 0,
    totalUnitsPending: 0,
    totalUniqueBuyers: 0,
    totalWastedValueAvoidedPkr: 0,
  };

  const confirmModalCopy = (() => {
    if (!confirmAction) return null;
    if (confirmAction.kind === 'approve-store') {
      return {
        tone: 'emerald' as const,
        title: `Approve ${confirmAction.store.name}?`,
        body: 'This unlocks Store POS login so the bakery can publish live closing-hour drops on BiteHour Islamabad.',
        confirmLabel: 'Yes, Approve Store',
      };
    }
    if (confirmAction.kind === 'revoke-store') {
      return {
        tone: 'amber' as const,
        title: `Pause ${confirmAction.store.name}?`,
        body: 'Moving this bakery back to pending immediately blocks their Store POS login until you approve it again.',
        confirmLabel: 'Yes, Move to Pending',
      };
    }
    if (confirmAction.kind === 'delete-store') {
      return {
        tone: 'red' as const,
        title: `Delete ${confirmAction.store.name}?`,
        body: 'This permanently deletes this store application and any associated items or deals. This action cannot be undone.',
        confirmLabel: 'Yes, Delete Permanently',
      };
    }
    if (confirmAction.kind === 'delete-subscriber') {
      return {
        tone: 'red' as const,
        title: `Remove ${confirmAction.subscriber.phone}?`,
        body: 'Remove this phone number from Islamabad evening WhatsApp drop alerts.',
        confirmLabel: 'Yes, Remove Subscriber',
      };
    }
    if (confirmAction.kind === 'delete-push-subscriber') {
      return {
        tone: 'red' as const,
        title: `Remove ${confirmAction.pushSub.deviceType} device?`,
        body: `Remove this device (${confirmAction.pushSub.sectors.join(', ')}) from automatic push notifications.`,
        confirmLabel: 'Yes, Remove Device',
      };
    }
    return {
      tone: confirmAction.nextStatus === 'rejected' ? ('red' as const) : ('emerald' as const),
      title: `Mark ${confirmAction.lead.businessName} as ${confirmAction.nextStatus}?`,
      body: `Confirm updating this /partner inquiry status to "${confirmAction.nextStatus}".`,
      confirmLabel: `Yes, Mark ${confirmAction.nextStatus}`,
    };
  })();

  const isConfirmBusy = Boolean(
    confirmAction &&
      busyId ===
        (confirmAction.kind === 'lead-status'
          ? confirmAction.lead.id
          : confirmAction.kind === 'delete-subscriber'
          ? confirmAction.subscriber.id
          : confirmAction.kind === 'delete-push-subscriber'
          ? confirmAction.pushSub.id
          : confirmAction.store.id)
  );

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
              Review pending stores, confirm approvals safely, and notify owners on WhatsApp or email.
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

      {/* Action Feedback Alert Notice */}
      {alertNotice && (
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150 ${
            alertNotice.type === 'success'
              ? 'bg-[#edf7ed] border-[#c8e6c9] text-[#1B4332]'
              : 'bg-[#fff8e1] border-[#ffecb3] text-amber-950'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {alertNotice.type === 'success' ? (
              <CheckCircle2 className="size-5 text-[#2e7d32] shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="size-5 text-[#f37021] shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-xs sm:text-sm font-extrabold">{alertNotice.title}</p>
              <p className="text-xs opacity-90 font-medium">{alertNotice.message}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {alertNotice.whatsappHref && (
              <a
                href={alertNotice.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-full bg-[#25D366] hover:bg-[#20bd59] text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-2xs"
              >
                <MessageCircle className="size-3.5" />
                <span>Notify on WhatsApp</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => setAlertNotice(null)}
              className="p-1.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
              title="Dismiss Alert"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
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
          <span className="text-[11px] font-bold text-stone-500 block">Push Devices</span>
          <span className="text-2xl font-extrabold text-[#1B4332]">{stats.pushSubscribersCount}</span>
        </div>
        <div className="bg-white border border-[#E7E2D8] rounded-2xl p-4">
          <span className="text-[11px] font-bold text-stone-500 block">WhatsApp List</span>
          <span className="text-2xl font-extrabold text-[#C85610]">{stats.dropSubscribersCount}</span>
        </div>
        <div className="bg-white border border-[#E7E2D8] rounded-2xl p-4">
          <span className="text-[11px] font-bold text-stone-500 block">Active Live Deals</span>
          <span className="text-2xl font-extrabold text-[#2e7d32]">{stats.activeDealsCount}</span>
        </div>
        <button
          type="button"
          onClick={() => setActiveSection('sales')}
          className="bg-[#FFF8F1] hover:bg-[#FFF1E4] border border-[#f37021]/30 rounded-2xl p-4 text-left transition-colors cursor-pointer"
        >
          <span className="text-[11px] font-bold text-[#C85610] block">Collected Sales</span>
          <span className="text-xl font-extrabold text-[#f37021]">
            {formatCurrency(platformSales.totalCollectedRevenuePkr)}
          </span>
        </button>
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
          onClick={() => setActiveSection('subscribers')}
          className={`px-4 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSection === 'subscribers'
              ? 'bg-[#1B4332] text-white border-[#1B4332]'
              : 'bg-white text-stone-700 border-[#E5DFD3] hover:bg-stone-50'
          }`}
        >
          <BellRing className="size-3.5" />
          <span>
            Drop Alerts (
            {(overview?.pushSubscribers?.length ?? 0) + (overview?.dropSubscribers?.length ?? 0)})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('sales')}
          className={`px-4 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSection === 'sales'
              ? 'bg-[#1B4332] text-white border-[#1B4332]'
              : 'bg-white text-stone-700 border-[#E5DFD3] hover:bg-stone-50'
          }`}
        >
          <TrendingUp className="size-3.5" />
          <span>Sales &amp; Stores ({platformSales.totalOrdersCount})</span>
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
              const approvalMsg = buildStoreApprovalMsg(store);
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
                      onClick={() => setConfirmAction({ kind: 'approve-store', store })}
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
                      onClick={() => setConfirmAction({ kind: 'delete-store', store })}
                      className="px-3.5 py-2 rounded-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <XCircle className="size-3.5" />
                      <span>Reject &amp; Delete</span>
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
              const outreachMsg = `Assalam-o-Alaikum ${lead.ownerName}! Thank you for applying ${lead.businessName} (${lead.sector}, ${lead.city}) to BiteHour. Reply here or register your Store POS login at ${appOrigin}/merchant so we can approve your account right away.`;
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
                      onChange={(e) => handleLeadSelect(lead, e.target.value as AdminPartnerLead['status'])}
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
      ) : activeSection === 'subscribers' ? (
        <div className="space-y-6">
          {/* 1. Automatic Push Devices */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#1B4332] flex items-center gap-2">
                <Smartphone className="size-4" />
                <span>Instant Push Notification Devices ({overview?.pushSubscribers?.length ?? 0})</span>
              </h2>
              {Boolean(overview?.pushSubscribers?.length) && (
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(
                    (overview?.pushSubscribers || []).reduce<Record<string, number>>((acc, item) => {
                      for (const sec of item.sectors || ['All Islamabad']) {
                        acc[sec] = (acc[sec] || 0) + 1;
                      }
                      return acc;
                    }, {})
                  ).map(([sector, count]) => (
                    <span
                      key={sector}
                      className="px-2.5 py-0.5 rounded-full bg-[#edf7ed] text-[#1B4332] border border-[#c8e6c9] text-[10px] font-bold"
                    >
                      {sector}: {count}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {!overview?.pushSubscribers?.length ? (
              <div className="bg-white border border-[#E7E2D8] rounded-3xl p-8 text-center space-y-1.5">
                <BellRing className="size-7 text-stone-400 mx-auto" />
                <p className="text-sm font-bold text-stone-900">No Push Devices Enabled Yet</p>
                <p className="text-xs text-stone-500">
                  Customers who tap &ldquo;Enable Instant Drop Notifications&rdquo; get automatic
                  alerts on their phone or desktop whenever bakeries post matching drops.
                </p>
              </div>
            ) : (
              overview.pushSubscribers.map((pushSub) => (
                <div
                  key={pushSub.id}
                  className="bg-white border border-[#E7E2D8] rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#1B4332] text-white text-[10px] font-black uppercase">
                        {pushSub.deviceType}
                      </span>
                      {(pushSub.sectors || ['All Islamabad']).map((sec) => (
                        <span
                          key={sec}
                          className="px-2.5 py-0.5 rounded-full bg-[#FFF3E6] text-[#C85610] border border-[#f37021]/25 text-[10px] font-black uppercase"
                        >
                          {sec}
                        </span>
                      ))}
                      {(pushSub.preferences || ['all']).map((pref) => (
                        <span
                          key={pref}
                          className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-bold uppercase"
                        >
                          {pref}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-stone-500 font-medium">
                      {pushSub.city} • Updated{' '}
                      {pushSub.updatedAt
                        ? new Date(pushSub.updatedAt).toLocaleDateString()
                        : pushSub.createdAt
                        ? new Date(pushSub.createdAt).toLocaleDateString()
                        : 'Recently'}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={busyId === pushSub.id}
                    onClick={() => setConfirmAction({ kind: 'delete-push-subscriber', pushSub })}
                    className="px-3.5 py-2 rounded-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* 2. Secondary WhatsApp Waitlist */}
          <div className="space-y-3">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-stone-700 px-1 flex items-center gap-2">
              <MessageCircle className="size-4 text-[#15803d]" />
              <span>WhatsApp Drop Waitlist ({overview?.dropSubscribers?.length ?? 0})</span>
            </h2>

            {!overview?.dropSubscribers?.length ? (
              <div className="bg-white border border-[#E7E2D8] rounded-3xl p-8 text-center space-y-1.5">
                <MessageCircle className="size-7 text-stone-400 mx-auto" />
                <p className="text-sm font-bold text-stone-900">No WhatsApp Subscribers Yet</p>
                <p className="text-xs text-stone-500">
                  Customers who choose the WhatsApp fallback tab appear here for 1-tap evening pings.
                </p>
              </div>
            ) : (
              overview.dropSubscribers.map((subscriber) => {
                const sectorList =
                  subscriber.sectors && subscriber.sectors.length > 0
                    ? subscriber.sectors
                    : [subscriber.sector || 'All Islamabad'];
                const prefList =
                  subscriber.preferences && subscriber.preferences.length > 0
                    ? subscriber.preferences
                    : [subscriber.preference || 'all'];
                const dropPingMsg = `Assalam-o-Alaikum${subscriber.name ? ` ${subscriber.name}` : ''}! Tonight's BiteHour surplus boxes & closing deals just dropped in ${sectorList.join(', ')}. Reserve before it sells out: ${appOrigin}`;
                return (
                  <div
                    key={subscriber.id}
                    className="bg-white border border-[#E7E2D8] rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {sectorList.map((sec) => (
                          <span
                            key={sec}
                            className="px-2.5 py-0.5 rounded-full bg-[#FFF3E6] text-[#C85610] border border-[#f37021]/25 text-[10px] font-black uppercase"
                          >
                            {sec}
                          </span>
                        ))}
                        {prefList.map((pref) => (
                          <span
                            key={pref}
                            className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-bold uppercase"
                          >
                            {pref}
                          </span>
                        ))}
                      </div>
                      <h3 className="text-base font-extrabold text-stone-900">
                        {subscriber.name || 'Islamabad Customer'}{' '}
                        <span className="text-xs font-semibold text-stone-500">
                          ({subscriber.phone})
                        </span>
                      </h3>
                      <p className="text-xs text-stone-500">
                        {subscriber.city} • Joined{' '}
                        {subscriber.createdAt
                          ? new Date(subscriber.createdAt).toLocaleDateString()
                          : 'Recently'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                      <a
                        href={toWhatsAppHref(subscriber.phone, dropPingMsg)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-full bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#15803d] border border-[#25D366]/40 text-xs font-bold flex items-center gap-1.5"
                      >
                        <MessageCircle className="size-3.5" />
                        <span>Send Drop Alert</span>
                      </a>

                      <button
                        type="button"
                        disabled={busyId === subscriber.id}
                        onClick={() => setConfirmAction({ kind: 'delete-subscriber', subscriber })}
                        className="px-3.5 py-2 rounded-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="size-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : activeSection === 'sales' ? (
        <div className="space-y-6">
          {/* Platform-Wide Sales Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
            <div className="bg-white border border-[#E7E2D8] rounded-2xl p-4 space-y-1">
              <span className="text-[11px] font-bold text-stone-500 block">Collected Revenue</span>
              <span className="text-xl font-black text-[#f37021] block">
                {formatCurrency(platformSales.totalCollectedRevenuePkr)}
              </span>
              <span className="text-[11px] text-stone-500">
                {platformSales.collectedOrdersCount} completed pickups
              </span>
            </div>

            <div className="bg-white border border-[#E7E2D8] rounded-2xl p-4 space-y-1">
              <span className="text-[11px] font-bold text-stone-500 block">Pending Pickup Value</span>
              <span className="text-xl font-black text-amber-700 block">
                {formatCurrency(platformSales.totalPendingRevenuePkr)}
              </span>
              <span className="text-[11px] text-stone-500">
                {platformSales.totalUnitsPending} boxes reserved
              </span>
            </div>

            <div className="bg-white border border-[#E7E2D8] rounded-2xl p-4 space-y-1">
              <span className="text-[11px] font-bold text-stone-500 block">Total Boxes Sold</span>
              <span className="text-xl font-black text-[#1B4332] block">
                {platformSales.totalUnitsSold} Boxes
              </span>
              <span className="text-[11px] text-stone-500">
                Across {overview?.storeAnalytics?.length ?? 0} stores
              </span>
            </div>

            <div className="bg-white border border-[#E7E2D8] rounded-2xl p-4 space-y-1">
              <span className="text-[11px] font-bold text-stone-500 block">Unique Buyers</span>
              <span className="text-xl font-black text-[#171916] block">
                {platformSales.totalUniqueBuyers} Buyers
              </span>
              <span className="text-[11px] text-stone-500">
                {platformSales.totalOrdersCount} total reservations
              </span>
            </div>

            <div className="bg-white border border-[#E7E2D8] rounded-2xl p-4 space-y-1 col-span-2 md:col-span-1">
              <span className="text-[11px] font-bold text-stone-500 block">Food Value Rescued</span>
              <span className="text-xl font-black text-[#2e7d32] block">
                {formatCurrency(platformSales.totalWastedValueAvoidedPkr)}
              </span>
              <span className="text-[11px] text-stone-500">Retail value saved</span>
            </div>
          </div>

          {/* Per-Store Performance Breakdown */}
          <div className="bg-white p-5 sm:p-6 rounded-[2rem] border border-[#E7E2D8] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-black text-[#171916] flex items-center gap-2">
                  <PackageCheck className="size-4 text-[#1B4332]" />
                  <span>Every Store&apos;s Performance ({overview?.storeAnalytics?.length ?? 0})</span>
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Per-bakery revenue, sold boxes, active vs expired deals, unique buyers, and top items.
                </p>
              </div>
            </div>

            {!overview?.storeAnalytics?.length ? (
              <div className="p-8 rounded-2xl bg-[#FAF8F3] border border-[#E7E2D8] text-center text-xs text-stone-500">
                No registered stores yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F3] text-stone-600 uppercase font-bold text-[10px] tracking-wider border-b border-[#E7E2D8]">
                    <tr>
                      <th className="p-3">Store &amp; Owner</th>
                      <th className="p-3">Deals</th>
                      <th className="p-3">Sold / Pending</th>
                      <th className="p-3">Collected Revenue</th>
                      <th className="p-3">Buyers</th>
                      <th className="p-3">Top Item</th>
                      <th className="p-3 text-right">Orders</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFEBE2]">
                    {overview.storeAnalytics.map((st) => (
                      <tr key={st.storeId} className="hover:bg-[#FAF8F3]/70 transition-colors align-top">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900">{st.storeName}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                st.isVerified
                                  ? 'bg-[#edf7ed] text-[#2e7d32] border border-[#c8e6c9]'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {st.isVerified ? 'Live' : 'Pending'}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500">
                            {st.sector ? `${st.sector}, ` : ''}
                            {st.city}
                            {st.ownerName ? ` • ${st.ownerName}` : ''}
                            {st.contactPhone ? ` (${st.contactPhone})` : ''}
                          </p>
                        </td>

                        <td className="p-3">
                          <span className="font-bold text-[#1B4332]">{st.activeDealsCount} live</span>
                          <p className="text-[11px] text-stone-500">{st.expiredDealsCount} expired</p>
                        </td>

                        <td className="p-3">
                          <span className="font-bold text-stone-900">{st.unitsSold} sold</span>
                          <p className="text-[11px] text-stone-500">{st.unitsPending} pending</p>
                        </td>

                        <td className="p-3">
                          <span className="font-black text-[#f37021]">
                            {formatCurrency(st.collectedRevenuePkr)}
                          </span>
                          {st.pendingRevenuePkr > 0 && (
                            <p className="text-[11px] text-amber-700 font-medium">
                              +{formatCurrency(st.pendingRevenuePkr)} pending
                            </p>
                          )}
                        </td>

                        <td className="p-3">
                          <span className="font-bold text-stone-900">{st.uniqueBuyersCount}</span>
                          <p className="text-[11px] text-stone-500">{st.totalOrdersCount} orders</p>
                        </td>

                        <td className="p-3">
                          {st.topItems[0] ? (
                            <div>
                              <p className="font-semibold text-stone-900">{st.topItems[0].itemName}</p>
                              <span className="text-[11px] text-stone-500">
                                {st.topItems[0].unitsSold} pcs •{' '}
                                {formatCurrency(st.topItems[0].revenuePkr)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-stone-400">No sales yet</span>
                          )}
                        </td>

                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSalesStoreId(st.storeId);
                              document
                                .getElementById('admin-orders-history')
                                ?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="px-3 py-1.5 rounded-full bg-[#F6F2EA] hover:bg-[#EDE6D8] border border-[#E5DFD3] text-[11px] font-bold text-[#1B4332] cursor-pointer"
                          >
                            View Orders
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* All Platform Orders & Buyer Details */}
          <div id="admin-orders-history">
            <OrdersHistoryPanel
              title="All Platform Orders & Buyer Info"
              subtitle="Every customer purchase across all stores with buyer contact, payment ref, and pickup code"
              orders={overview?.recentOrders || []}
              showStoreColumn={true}
              storeFilterOptions={(overview?.storeAnalytics || []).map((s) => ({
                id: s.storeId,
                name: s.storeName,
              }))}
              selectedStoreFilter={selectedSalesStoreId}
              onSelectStoreFilter={setSelectedSalesStoreId}
              exportFilename="BiteHour_Platform_Sales_Orders.csv"
              onRefresh={() => void loadOverview()}
              isRefreshing={isLoading}
            />
          </div>
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

                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    disabled={busyId === store.id}
                    onClick={() => setConfirmAction({ kind: 'revoke-store', store })}
                    className="px-4 py-2 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold cursor-pointer"
                  >
                    Pause / Move to Pending
                  </button>
                  <button
                    type="button"
                    disabled={busyId === store.id}
                    onClick={() => setConfirmAction({ kind: 'delete-store', store })}
                    className="px-3.5 py-2 rounded-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Confirmation Alert Modal */}
      {confirmAction && confirmModalCopy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white border border-[#E7E2D8] rounded-3xl p-6 shadow-2xl space-y-4">
            <button
              type="button"
              disabled={isConfirmBusy}
              onClick={() => setConfirmAction(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 cursor-pointer"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-start gap-3.5 pr-6">
              <div
                className={`size-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  confirmModalCopy.tone === 'red'
                    ? 'bg-red-50 text-red-600 border border-red-200'
                    : confirmModalCopy.tone === 'amber'
                    ? 'bg-amber-50 text-[#f37021] border border-amber-200'
                    : 'bg-[#edf7ed] text-[#1B4332] border border-[#c8e6c9]'
                }`}
              >
                {confirmModalCopy.tone === 'emerald' ? (
                  <CheckCircle2 className="size-6" />
                ) : (
                  <AlertTriangle className="size-6" />
                )}
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-stone-900">
                  {confirmModalCopy.title}
                </h3>
                <p className="text-xs sm:text-[13px] text-stone-600 leading-relaxed mt-1">
                  {confirmModalCopy.body}
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                disabled={isConfirmBusy}
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-2.5 px-4 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isConfirmBusy}
                onClick={executeConfirmedAction}
                className={`flex-1 py-2.5 px-4 rounded-full text-white text-xs font-black shadow-md disabled:opacity-50 cursor-pointer ${
                  confirmModalCopy.tone === 'red'
                    ? 'bg-red-600 hover:bg-red-700'
                    : confirmModalCopy.tone === 'amber'
                    ? 'bg-[#f37021] hover:bg-[#e26115]'
                    : 'bg-[#1B4332] hover:bg-[#133326]'
                }`}
              >
                {isConfirmBusy ? 'Please wait...' : confirmModalCopy.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
