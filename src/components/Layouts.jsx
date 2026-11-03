'use client';
import { CalendarDays, CalendarPlus, ClipboardList, Clock, History, LayoutDashboard, LogOut, Menu, Receipt, Scissors, Settings, Sparkles, UserCircle, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '../api/client.js';
import { homeFor, useAuth } from '../context/AuthContext.jsx';
import { Button, cx } from './ui.jsx';

const Logo = ({ to = '/' }) => (
  <Link href={to} className="flex items-center gap-2 font-display text-2xl font-semibold text-rose-700">
    <Sparkles className="h-5 w-5" aria-hidden /> BeautyCare
  </Link>
);

function NavLink({ to, end, className, children }) {
  const pathname = usePathname();
  const isActive = end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
  return <Link href={to} className={className({ isActive })} aria-current={isActive ? 'page' : undefined}>{children}</Link>;
}

const PUBLIC_LINKS = [['/', 'Beranda'], ['/profil', 'Profil'], ['/layanan', 'Layanan'], ['/terapis', 'Terapis']];

export function PublicLayout({ children }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [salon, setSalon] = useState(null);
  const pathname = usePathname();
  const router = useRouter();
  const nav = (to) => router.push(to);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => { api.get('/salon').then((r) => setSalon(r.data)).catch(() => {}); }, []);
  const link = ({ isActive }) => cx('rounded-full px-3 py-1.5 text-sm', isActive ? 'bg-blush-100 text-rose-700' : 'text-mist hover:text-charcoal');
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-blush-100 bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
            {PUBLIC_LINKS.map(([to, l]) => <NavLink key={to} to={to} end={to === '/'} className={link}>{l}</NavLink>)}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                <Button size="sm" variant="soft" onClick={() => nav(homeFor(user.role))}>Dashboard</Button>
                <Button size="sm" variant="ghost" onClick={() => { logout(); nav('/'); }}>Keluar</Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="ghost" onClick={() => nav('/masuk')}>Masuk</Button>
                <Button size="sm" onClick={() => nav('/daftar')}>Daftar</Button>
              </>
            )}
          </div>
          <button className="rounded-full p-2 md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Buka menu" aria-expanded={open}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {open && (
          <div className="space-y-1 border-t border-blush-100 px-4 py-3 md:hidden">
            {PUBLIC_LINKS.map(([to, l]) => <NavLink key={to} to={to} end={to === '/'} className={link}>{l}</NavLink>)}
            <div className="flex gap-2 pt-2">
              {user ? (
                <>
                  <Button size="sm" variant="soft" onClick={() => nav(homeFor(user.role))}>Dashboard</Button>
                  <Button size="sm" variant="ghost" onClick={() => { logout(); nav('/'); }}>Keluar</Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={() => nav('/masuk')}>Masuk</Button>
                  <Button size="sm" onClick={() => nav('/daftar')}>Daftar</Button>
                </>
              )}
            </div>
          </div>
        )}
      </header>
      <main className="flex-1">{children}</main>
      <Footer salon={salon} />
    </div>
  );
}

function Footer({ salon }) {
  const s = salon?.salon;
  return (
    <footer className="mt-16 border-t border-blush-100 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-mist">{s?.tagline || 'Salon dan klinik kecantikan.'}</p>
        </div>
        <div className="text-sm text-mist">
          <p className="mb-2 font-display text-lg text-charcoal">Kontak</p>
          <p>{s?.address}</p>
          <p>{s?.phone}</p>
          <p>{s?.email}</p>
          {s?.instagram && <p>{s.instagram}</p>}
        </div>
        <div className="text-sm text-mist">
          <p className="mb-2 font-display text-lg text-charcoal">Jam operasional</p>
          <HoursList hours={salon?.hours} compact />
        </div>
      </div>
      <p className="border-t border-blush-100 py-4 text-center text-xs text-mist">© {new Date().getFullYear()} BeautyCare. Semua hak dilindungi.</p>
    </footer>
  );
}

const DAY = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
export function HoursList({ hours, compact }) {
  if (!hours) return null;
  const order = [1, 2, 3, 4, 5, 6, 0];
  return (
    <ul className={compact ? 'space-y-0.5' : 'divide-y divide-blush-100'}>
      {order.map((d) => {
        const h = hours.find((x) => x.day_of_week === d);
        return (
          <li key={d} className={cx('flex justify-between gap-6', !compact && 'py-2')}>
            <span>{DAY[d]}</span>
            <span>{!h || h.is_closed ? 'Tutup' : `${h.open_time} – ${h.close_time}`}</span>
          </li>
        );
      })}
    </ul>
  );
}

const MENUS = {
  customer: [
    ['/pelanggan', 'Buat Reservasi', CalendarPlus, true],
    ['/pelanggan/aktif', 'Reservasi Aktif', ClipboardList],
    ['/pelanggan/jadwal', 'Jadwal', CalendarDays],
    ['/pelanggan/riwayat', 'Riwayat', History],
    ['/pelanggan/profil', 'Profil', UserCircle],
  ],
  staff: [
    ['/staff', 'Jadwal Pelayanan', CalendarDays, true],
    ['/staff/ketersediaan', 'Ketersediaan', Clock],
    ['/staff/profil', 'Profil', UserCircle],
  ],
  admin: [
    ['/admin', 'Dashboard', LayoutDashboard, true],
    ['/admin/reservasi', 'Reservasi', ClipboardList],
    ['/admin/layanan', 'Layanan', Scissors],
    ['/admin/staf', 'Staf & Terapis', Users],
    ['/admin/jam', 'Jam Operasional', Settings],
    ['/admin/transaksi', 'Rekap Transaksi', Receipt],
  ],
};
const TITLES = { customer: 'Area Pelanggan', staff: 'Area Staf', admin: 'Panel Admin' };

export function DashboardLayout({ role, children }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const nav = (to) => router.push(to);
  useEffect(() => setOpen(false), [pathname]);
  const items = MENUS[role];
  const item = ({ isActive }) => cx('flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium', isActive ? 'bg-blush-100 text-rose-700' : 'text-mist hover:bg-blush-50 hover:text-charcoal');
  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="p-5"><Logo to="/" /><p className="mt-1 text-xs text-mist">{TITLES[role]}</p></div>
      <nav className="flex-1 space-y-1 px-3" aria-label="Menu dashboard">
        {items.map(([to, label, Icon, end]) => <NavLink key={to} to={to} end={end} className={item}><Icon className="h-4 w-4" aria-hidden />{label}</NavLink>)}
      </nav>
      <div className="border-t border-blush-100 p-4">
        <p className="truncate text-sm font-medium">{user?.name}</p>
        <p className="truncate text-xs text-mist">{user?.email}</p>
        <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => { logout(); nav('/'); }}><LogOut className="h-4 w-4" />Keluar</Button>
      </div>
    </div>
  );
  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-blush-100 bg-white lg:block">{sidebar}</aside>
      <div className="flex items-center justify-between border-b border-blush-100 bg-white px-4 py-3 lg:hidden">
        <Logo to="/" />
        <button onClick={() => setOpen(true)} aria-label="Buka menu" className="rounded-full p-2"><Menu className="h-6 w-6" /></button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-charcoal/40" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-72 max-w-[85vw] bg-white shadow-soft">
            <button onClick={() => setOpen(false)} aria-label="Tutup menu" className="absolute right-3 top-3 rounded-full p-2"><X className="h-5 w-5" /></button>
            {sidebar}
          </aside>
        </div>
      )}
      <main className="min-w-0 flex-1 p-4 sm:p-8">{children}</main>
    </div>
  );
}
