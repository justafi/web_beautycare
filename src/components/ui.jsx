'use client';
import { ImageOff, Inbox, Loader2, X } from 'lucide-react';
import { forwardRef, useEffect, useState } from 'react';
import { PAYMENT, STATUS } from '../lib/format.js';

export const cx = (...a) => a.filter(Boolean).join(' ');

const VARIANTS = {
  primary: 'bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose/60',
  soft: 'bg-blush-100 text-rose-700 hover:bg-blush-200',
  outline: 'border border-rose/50 text-rose-700 hover:bg-blush-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'text-mist hover:bg-blush-50 hover:text-charcoal',
};
const SIZES = { sm: 'px-3 py-1.5 text-sm', md: 'px-5 py-2.5 text-sm', lg: 'px-7 py-3.5 text-base' };

export function Button({ variant = 'primary', size = 'md', loading, className, children, disabled, ...p }) {
  return (
    <button
      disabled={disabled || loading}
      className={cx('inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-70', VARIANTS[variant], SIZES[size], className)}
      {...p}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function Field({ label, error, hint, children, className }) {
  return (
    <label className={cx('block text-sm', className)}>
      {label && <span className="mb-1.5 block font-medium text-charcoal">{label}</span>}
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-mist">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-700" role="alert">{error}</span>}
    </label>
  );
}
const inputCls = 'w-full rounded-xl border border-blush-200 bg-white px-4 py-2.5 text-sm text-charcoal placeholder:text-mist/70 focus:border-rose-600 focus:outline-none disabled:bg-stone-100';
export const Input = forwardRef(({ className, ...p }, ref) => <input ref={ref} className={cx(inputCls, className)} {...p} />);
export const Textarea = forwardRef(({ className, ...p }, ref) => <textarea ref={ref} rows={3} className={cx(inputCls, className)} {...p} />);
export const Select = forwardRef(({ className, children, ...p }, ref) => <select ref={ref} className={cx(inputCls, className)} {...p}>{children}</select>);

export const Card = ({ className, children, ...p }) => <div className={cx('rounded-3xl border border-blush-100 bg-white p-5 shadow-soft', className)} {...p}>{children}</div>;

export function Badge({ className, children }) {
  return <span className={cx('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', className)}>{children}</span>;
}
export const StatusBadge = ({ status }) => <Badge className={STATUS[status]?.cls}>{STATUS[status]?.label || status}</Badge>;
export const PaymentBadge = ({ status }) => <Badge className={PAYMENT[status]?.cls}>{PAYMENT[status]?.label || status}</Badge>;

export const Spinner = ({ label = 'Memuat data…' }) => (
  <div className="flex items-center justify-center gap-2 py-16 text-mist" role="status">
    <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> <span className="text-sm">{label}</span>
  </div>
);

export function EmptyState({ icon: Icon = Inbox, title, text, action }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-blush-200 bg-white/60 px-6 py-14 text-center">
      <span className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-blush-100 text-rose-600"><Icon className="h-6 w-6" aria-hidden /></span>
      <p className="font-display text-xl">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-mist">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-800" role="alert">
      <p>{message}</p>
      {onRetry && <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>Coba lagi</Button>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-charcoal/40 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={cx('max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-soft sm:rounded-3xl', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-2xl">{title}</h2>
          <button onClick={onClose} aria-label="Tutup" className="rounded-full p-1.5 text-mist hover:bg-blush-50"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmText = 'Ya, lanjutkan', danger, loading, onConfirm, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-mist">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Batal</Button>
        <Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>{confirmText}</Button>
      </div>
    </Modal>
  );
}

export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="text-3xl sm:text-4xl">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-mist">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);

export function SmartImage({ src, alt, className, iconSize = 'h-8 w-8' }) {
  const [failed, setFailed] = useState(!src);
  useEffect(() => setFailed(!src), [src]);
  if (failed) {
    return <div className={cx('grid place-items-center bg-gradient-to-br from-blush-100 to-blush-200 text-rose', className)} role="img" aria-label={alt}><ImageOff className={iconSize} aria-hidden /></div>;
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={cx('object-cover', className)} />;
}

export function Pagination({ page, pageSize, total, onChange }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-mist">
      <span>Halaman {page} dari {pages} ({total} data)</span>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onChange(page - 1)}>Sebelumnya</Button>
        <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => onChange(page + 1)}>Berikutnya</Button>
      </div>
    </div>
  );
}

export const StatCard = ({ icon: Icon, label, value, hint }) => (
  <Card className="flex items-center gap-4">
    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blush-100 text-rose-700"><Icon className="h-6 w-6" aria-hidden /></span>
    <div className="min-w-0">
      <p className="truncate text-sm text-mist">{label}</p>
      <p className="font-display text-3xl leading-tight">{value}</p>
      {hint && <p className="text-xs text-mist">{hint}</p>}
    </div>
  </Card>
);
