import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Download,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  ShoppingBag,
  Store,
} from 'lucide-react';
import type { StoreOrderRecord } from '../types';
import { downloadCsvFile, formatCurrency, formatWhatsAppHref } from '../lib/utils';

type OrderStatusFilter = 'all' | 'pending' | 'collected' | 'cancelled';

interface OrdersHistoryPanelProps {
  title: string;
  subtitle: string;
  orders: StoreOrderRecord[];
  showStoreColumn?: boolean;
  storeFilterOptions?: Array<{ id: string; name: string }>;
  selectedStoreFilter?: string;
  onSelectStoreFilter?: (storeId: string) => void;
  exportFilename: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onMarkCollected?: (orderId: string) => Promise<void> | void;
  busyOrderId?: string | null;
}

const STATUS_BADGE_CLASSES: Record<string, string> = {
  collected: 'bg-[#edf7ed] text-[#1B4332] border-[#c8e6c9]',
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  'no-show': 'bg-stone-100 text-stone-700 border-stone-200',
  expired: 'bg-stone-100 text-stone-700 border-stone-200',
};

export const OrdersHistoryPanel: React.FC<OrdersHistoryPanelProps> = ({
  title,
  subtitle,
  orders,
  showStoreColumn = false,
  storeFilterOptions,
  selectedStoreFilter = 'all',
  onSelectStoreFilter,
  exportFilename,
  onRefresh,
  isRefreshing = false,
  onMarkCollected,
  busyOrderId,
}) => {
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((order) => {
      if (selectedStoreFilter !== 'all' && order.store.id !== selectedStoreFilter) {
        return false;
      }

      if (statusFilter === 'pending' && order.status !== 'pending') return false;
      if (statusFilter === 'collected' && order.status !== 'collected') return false;
      if (
        statusFilter === 'cancelled' &&
        order.status !== 'cancelled' &&
        order.status !== 'no-show' &&
        order.status !== 'expired'
      ) {
        return false;
      }

      if (!q) return true;
      return (
        order.pickupCode.toLowerCase().includes(q) ||
        order.item.name.toLowerCase().includes(q) ||
        order.buyer.name.toLowerCase().includes(q) ||
        order.buyer.phone.toLowerCase().includes(q) ||
        order.buyer.email.toLowerCase().includes(q) ||
        order.store.name.toLowerCase().includes(q)
      );
    });
  }, [orders, selectedStoreFilter, statusFilter, searchQuery]);

  const handleExportCsv = () => {
    const headers = [
      'Order Date',
      ...(showStoreColumn ? ['Store Name', 'Sector'] : []),
      'Pickup Code',
      'Item Sold',
      'Quantity',
      'Total PKR',
      'Original Value PKR',
      'Payment Method',
      'Payment Status',
      'Payment Ref',
      'Order Status',
      'Buyer Name',
      'Buyer Phone',
      'Buyer Email',
    ];
    const rows = filteredOrders.map((o) => [
      new Date(o.createdAt).toLocaleString(),
      ...(showStoreColumn ? [o.store.name, o.store.sector || o.store.city] : []),
      o.pickupCode,
      o.item.name,
      o.quantity,
      o.totalAmountPkr,
      o.originalValuePkr,
      o.paymentMethod,
      o.paymentStatus,
      o.paymentReference || '',
      o.status,
      o.buyer.name,
      o.buyer.phone || '',
      o.buyer.email || '',
    ]);
    downloadCsvFile(exportFilename, headers, rows);
  };

  return (
    <div className="bg-white p-5 sm:p-6 rounded-[2rem] border border-[#E7E2D8] shadow-xs space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-[#171916] flex items-center gap-2">
            <ShoppingBag className="size-4 text-[#1B4332]" />
            <span>{title}</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs bg-[#F6F2EA] text-[#1B4332] border border-[#E5DFD3] font-bold">
              {filteredOrders.length}
            </span>
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="px-3.5 py-2 rounded-full bg-[#F6F2EA] hover:bg-[#EDE6D8] border border-[#E5DFD3] text-xs font-bold text-[#171916] flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredOrders.length === 0}
            className="px-3.5 py-2 rounded-full bg-[#F6F2EA] hover:bg-[#EDE6D8] disabled:opacity-40 border border-[#E5DFD3] text-xs font-bold text-[#171916] flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="size-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'all', label: 'All Orders' },
              { id: 'pending', label: 'Pending Pickup' },
              { id: 'collected', label: 'Collected / Paid' },
              { id: 'cancelled', label: 'No-Show / Cancelled' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[#1B4332] text-white border-[#1B4332]'
                  : 'bg-[#FAF8F3] text-stone-700 border-[#E5DFD3] hover:bg-[#F1ECE2]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {storeFilterOptions && storeFilterOptions.length > 0 && onSelectStoreFilter && (
            <select
              value={selectedStoreFilter}
              onChange={(e) => onSelectStoreFilter(e.target.value)}
              className="h-9 px-3 rounded-full bg-[#FAF8F3] border border-[#E5DFD3] text-xs font-bold text-stone-800 cursor-pointer"
            >
              <option value="all">All Stores ({storeFilterOptions.length})</option>
              {storeFilterOptions.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          )}

          <div className="relative flex-1 min-w-[200px]">
            <Search className="size-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search buyer, phone, code, item..."
              className="w-full h-9 pl-8 pr-3 rounded-full bg-[#FAF8F3] border border-[#E5DFD3] text-xs font-medium text-[#171916] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
            />
          </div>
        </div>
      </div>

      {/* Orders List / Table */}
      {filteredOrders.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#FAF8F3] border border-[#E7E2D8] text-center space-y-1">
          <p className="text-sm font-bold text-stone-800">No Matching Orders Yet</p>
          <p className="text-xs text-stone-500">
            Reservations and collected pickups will appear here with buyer contact and payment details.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F3] text-stone-600 uppercase font-bold text-[10px] tracking-wider border-b border-[#E7E2D8]">
              <tr>
                {showStoreColumn && <th className="p-3">Store</th>}
                <th className="p-3">Item Sold</th>
                <th className="p-3">Buyer Info</th>
                <th className="p-3">Pickup Code</th>
                <th className="p-3">Payment &amp; Total</th>
                <th className="p-3">Status &amp; Time</th>
                {onMarkCollected && <th className="p-3 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEBE2]">
              {filteredOrders.map((order) => {
                const waHref = order.buyer.phone
                  ? formatWhatsAppHref(
                      order.buyer.phone,
                      `Assalam-o-Alaikum ${order.buyer.name}, regarding your BiteHour order ${order.pickupCode} (${order.item.name}) at ${order.store.name}.`
                    )
                  : '';
                const badgeClass =
                  STATUS_BADGE_CLASSES[order.status] ||
                  'bg-stone-100 text-stone-700 border-stone-200';
                return (
                  <tr key={order.id} className="hover:bg-[#FAF8F3]/70 transition-colors align-top">
                    {showStoreColumn && (
                      <td className="p-3">
                        <div className="font-bold text-stone-900 flex items-center gap-1">
                          <Store className="size-3.5 text-[#1B4332] shrink-0" />
                          <span>{order.store.name}</span>
                        </div>
                        <span className="text-[11px] text-stone-500">
                          {order.store.sector ? `${order.store.sector}, ` : ''}
                          {order.store.city}
                        </span>
                      </td>
                    )}

                    <td className="p-3">
                      <p className="font-bold text-stone-900">{order.item.name}</p>
                      <span className="text-[11px] text-stone-500">
                        Qty: <strong>{order.quantity}</strong> • Retail{' '}
                        {formatCurrency(order.originalValuePkr)}
                      </span>
                    </td>

                    <td className="p-3 space-y-0.5">
                      <p className="font-bold text-stone-900">{order.buyer.name}</p>
                      {order.buyer.phone && (
                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          <a
                            href={`tel:${order.buyer.phone}`}
                            className="inline-flex items-center gap-1 font-semibold text-[#1B4332] hover:underline"
                          >
                            <Phone className="size-3" />
                            <span>{order.buyer.phone}</span>
                          </a>
                          {waHref && (
                            <a
                              href={waHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#25D366]/15 text-[#15803d] font-bold"
                            >
                              <MessageCircle className="size-3" />
                              <span>WhatsApp</span>
                            </a>
                          )}
                        </div>
                      )}
                      {order.buyer.email && (
                        <p className="text-[11px] text-stone-500 flex items-center gap-1">
                          <Mail className="size-3 shrink-0" />
                          <span className="truncate max-w-[190px]">{order.buyer.email}</span>
                        </p>
                      )}
                    </td>

                    <td className="p-3">
                      <span className="font-mono text-xs font-black text-[#1B4332] bg-[#F6F2EA] px-2.5 py-1 rounded-lg border border-[#E5DFD3] inline-block">
                        {order.pickupCode}
                      </span>
                    </td>

                    <td className="p-3">
                      <p className="font-black text-[#f37021] text-sm">
                        {formatCurrency(order.totalAmountPkr)}
                      </p>
                      <p className="text-[11px] text-stone-600 font-medium">
                        {order.paymentMethod} •{' '}
                        <span
                          className={
                            order.paymentStatus === 'paid'
                              ? 'text-[#15803d] font-bold'
                              : 'text-amber-700 font-bold'
                          }
                        >
                          {order.paymentStatus === 'paid' ? 'Paid' : 'Counter Pending'}
                        </span>
                      </p>
                      {order.paymentReference && (
                        <p className="text-[10px] font-mono text-stone-500">
                          Ref: {order.paymentReference}
                        </p>
                      )}
                    </td>

                    <td className="p-3 space-y-1">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase ${badgeClass}`}
                      >
                        {order.status}
                      </span>
                      <p className="text-[11px] text-stone-500">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </td>

                    {onMarkCollected && (
                      <td className="p-3 text-right">
                        {order.status === 'pending' ? (
                          <button
                            type="button"
                            disabled={busyOrderId === order.id}
                            onClick={() => onMarkCollected(order.id)}
                            className="px-3 py-1.5 rounded-full bg-[#1B4332] hover:bg-[#133326] disabled:opacity-50 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="size-3.5" />
                            <span>
                              {busyOrderId === order.id ? 'Saving...' : 'Mark Collected'}
                            </span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-stone-400 font-medium">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
