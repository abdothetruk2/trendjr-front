import React from 'react';
import {
  AlertTriangle, Clock3, CheckCircle2, Loader, Truck, PackageCheck, XCircle, CircleDollarSign, Ban, Undo2,
  CalendarClock, CircleSlash, EyeOff, Eye, ShieldCheck, UserRound, PackageX, Infinity as InfinityIcon,
} from 'lucide-react';

// Status pills: always an icon + a word, never color alone.
// Used by the admin dashboard and the customer's order pages.
const STATUS = {
  order: {
    pending: { label: 'Pending', icon: Clock3, cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
    confirmed: { label: 'Confirmed', icon: CheckCircle2, cls: 'bg-sky-50 text-sky-700 ring-sky-200' },
    processing: { label: 'Processing', icon: Loader, cls: 'bg-violet-50 text-violet-700 ring-violet-200' },
    shipped: { label: 'Shipped', icon: Truck, cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
    delivered: { label: 'Delivered', icon: PackageCheck, cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    cancelled: { label: 'Cancelled', icon: XCircle, cls: 'bg-rose-50 text-rose-700 ring-rose-200' },
  },
  payment: {
    pending: { label: 'Unpaid', icon: Clock3, cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
    paid: { label: 'Paid', icon: CircleDollarSign, cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    failed: { label: 'Failed', icon: Ban, cls: 'bg-rose-50 text-rose-700 ring-rose-200' },
    refunded: { label: 'Refunded', icon: Undo2, cls: 'bg-slate-100 text-slate-700 ring-slate-200' },
  },
  coupon: {
    active: { label: 'Active', icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    scheduled: { label: 'Scheduled', icon: CalendarClock, cls: 'bg-sky-50 text-sky-700 ring-sky-200' },
    expired: { label: 'Expired', icon: Clock3, cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
    'used-up': { label: 'Used up', icon: CircleSlash, cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
    inactive: { label: 'Off', icon: EyeOff, cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
  },
  visibility: {
    active: { label: 'Visible', icon: Eye, cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    hidden: { label: 'Hidden', icon: EyeOff, cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
  },
  customer: {
    active: { label: 'Active', icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    blocked: { label: 'Blocked', icon: Ban, cls: 'bg-rose-50 text-rose-700 ring-rose-200' },
  },
  role: {
    admin: { label: 'Admin', icon: ShieldCheck, cls: 'bg-primary-50 text-primary-700 ring-primary-200' },
    user: { label: 'Customer', icon: UserRound, cls: 'bg-slate-100 text-slate-700 ring-slate-200' },
  },
  stock: {
    in: { label: 'In stock', icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    low: { label: 'Low stock', icon: AlertTriangle, cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
    out: { label: 'Out of stock', icon: PackageX, cls: 'bg-rose-50 text-rose-700 ring-rose-200' },
    untracked: { label: 'Not tracked', icon: InfinityIcon, cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
  },
};

export default function StatusBadge({ kind, status }) {
  const style = STATUS[kind]?.[status] || { label: status || 'Unknown', icon: AlertTriangle, cls: 'bg-slate-100 text-slate-600 ring-slate-200' };
  const Icon = style.icon;
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${style.cls}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {style.label}
    </span>
  );
}

export const ORDER_STATUS_OPTIONS = Object.entries(STATUS.order).map(([value, { label }]) => ({ value, label }));
export const PAYMENT_STATUS_OPTIONS = Object.entries(STATUS.payment).map(([value, { label }]) => ({ value, label }));
