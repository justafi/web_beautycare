export const rupiah = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(n || 0));

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
export const DAY_NAMES = DAYS;
export const dayName = (dow) => DAYS[dow];

export const parseDate = (s) => new Date(`${s}T00:00:00Z`);
export const formatDate = (s, withDay = true) => {
  const d = parseDate(s);
  const base = `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  return withDay ? `${DAYS[d.getUTCDay()]}, ${base}` : base;
};
export const formatShort = (s) => { const d = parseDate(s); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()].slice(0, 3)}`; };
export const monthLabel = (y, m) => `${MONTHS[m]} ${y}`;

export const todayWIB = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
export const addDays = (s, n) => { const d = parseDate(s); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

export const STATUS = {
  pending: { label: 'Menunggu konfirmasi', cls: 'bg-amber-100 text-amber-800' },
  confirmed: { label: 'Dikonfirmasi', cls: 'bg-sky-100 text-sky-800' },
  in_progress: { label: 'Sedang berlangsung', cls: 'bg-violet-100 text-violet-800' },
  completed: { label: 'Selesai', cls: 'bg-emerald-100 text-emerald-800' },
  cancelled: { label: 'Dibatalkan', cls: 'bg-stone-200 text-stone-700' },
};
export const PAYMENT = {
  unpaid: { label: 'Belum dibayar', cls: 'bg-amber-100 text-amber-800' },
  paid: { label: 'Lunas', cls: 'bg-emerald-100 text-emerald-800' },
  refunded: { label: 'Dikembalikan', cls: 'bg-stone-200 text-stone-700' },
};
export const METHODS = { cash: 'Tunai', transfer: 'Transfer', qris: 'QRIS', card: 'Kartu', other: 'Lainnya' };
