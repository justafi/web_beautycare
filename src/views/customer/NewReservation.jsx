'use client';
import { CalendarCheck, Check, Clock } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, parseError } from '../../api/client.js';
import { Button, Card, ConfirmDialog, ErrorState, Field, Input, PageHeader, Spinner, Textarea, cx } from '../../components/ui.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { addDays, formatDate, rupiah, todayWIB } from '../../lib/format.js';
import { useFetch } from '../../lib/useFetch.js';

export default function NewReservation() {
  const toast = useToast();
  const router = useRouter();
  const nav = (to) => router.push(to);
  const params = useSearchParams();
  const services = useFetch('/services');
  const staffRes = useFetch('/staff');
  const salon = useFetch('/salon');
  const [serviceId, setServiceId] = useState(params.get('layanan') || null);
  const [staffId, setStaffId] = useState(null);
  const [date, setDate] = useState(params.get('tanggal') || todayWIB());
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const service = useMemo(() => services.data?.services.find((s) => s.id === serviceId), [services.data, serviceId]);
  const staffOptions = useMemo(() => (staffRes.data?.staff || []).filter((s) => s.services.some((x) => x.id === serviceId)), [staffRes.data, serviceId]);
  const staff = staffOptions.find((s) => s.id === staffId);

  const loadSlots = async () => {
    if (!serviceId || !date) return;
    setSlotsLoading(true); setSlotsError(''); setTime('');
    try {
      const r = await api.get('/slots', { params: { service_id: serviceId, date, staff_id: staffId || undefined } });
      setSlots(r.data.slots);
    } catch (e) { setSlotsError(parseError(e).message); setSlots([]); } finally { setSlotsLoading(false); }
  };
  useEffect(() => { loadSlots(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [serviceId, staffId, date]);
  useEffect(() => { if (staffId && !staffOptions.some((s) => s.id === staffId)) setStaffId(null); }, [staffOptions, staffId]);

  const submit = async () => {
    setSaving(true);
    try {
      const { data } = await api.post('/reservations', { service_id: serviceId, staff_id: staffId || null, date, time, notes: notes || null });
      toast.success(`Reservasi ${data.reservation.code} berhasil dibuat. Menunggu konfirmasi salon.`);
      nav('/pelanggan/aktif');
    } catch (e) {
      const p = parseError(e);
      toast.error(p.message);
      setConfirmOpen(false);
      if (e.response?.status === 409) loadSlots(); // slot baru saja diambil orang lain
    } finally { setSaving(false); }
  };

  if (services.loading || staffRes.loading) return <Spinner />;
  if (services.error) return <ErrorState message={services.error} onRetry={services.reload} />;
  const maxDate = addDays(todayWIB(), salon.data?.salon.max_advance_days || 60);

  return (
    <>
      <PageHeader title="Buat reservasi" subtitle="Pilih layanan, terapis, tanggal, dan jam yang tersedia." />
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 text-2xl">1. Layanan</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {services.data.services.map((s) => (
                <button key={s.id} onClick={() => setServiceId(s.id)} aria-pressed={serviceId === s.id}
                  className={cx('rounded-2xl border p-4 text-left transition-colors', serviceId === s.id ? 'border-rose-600 bg-blush-50' : 'border-blush-200 hover:bg-blush-50')}>
                  <div className="flex items-start justify-between gap-2"><span className="font-medium">{s.name}</span>{serviceId === s.id && <Check className="h-4 w-4 text-rose-600" aria-hidden />}</div>
                  <p className="mt-1 text-xs text-mist">{s.category} · {s.duration_min} menit</p>
                  <p className="mt-1 text-sm text-rose-700">{rupiah(s.price)}</p>
                </button>
              ))}
            </div>
          </Card>

          {serviceId && (
            <>
              <Card>
                <h2 className="mb-3 text-2xl">2. Terapis</h2>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setStaffId(null)} aria-pressed={!staffId} className={cx('rounded-full border px-4 py-2 text-sm', !staffId ? 'border-rose-600 bg-rose-600 text-white' : 'border-blush-200 hover:bg-blush-50')}>Tanpa preferensi</button>
                  {staffOptions.map((s) => (
                    <button key={s.id} onClick={() => setStaffId(s.id)} aria-pressed={staffId === s.id} className={cx('rounded-full border px-4 py-2 text-sm', staffId === s.id ? 'border-rose-600 bg-rose-600 text-white' : 'border-blush-200 hover:bg-blush-50')}>{s.name}</button>
                  ))}
                </div>
                {staffOptions.length === 0 && <p className="mt-3 text-sm text-mist">Belum ada terapis untuk layanan ini.</p>}
              </Card>

              <Card>
                <h2 className="mb-3 text-2xl">3. Tanggal & waktu</h2>
                <Field label="Tanggal" className="max-w-xs"><Input type="date" min={todayWIB()} max={maxDate} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} /></Field>
                <p className="mb-2 mt-4 text-sm font-medium">Waktu tersedia</p>
                {slotsLoading ? <Spinner label="Mencari slot…" /> : slotsError ? <ErrorState message={slotsError} onRetry={loadSlots} /> : slots.length === 0 ? (
                  <p className="rounded-xl bg-blush-50 p-4 text-sm text-mist">Tidak ada slot pada tanggal ini (salon tutup, libur, atau sudah penuh). Coba tanggal atau terapis lain.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
                    {slots.map((s) => (
                      <button key={s.time} onClick={() => setTime(s.time)} aria-pressed={time === s.time}
                        className={cx('rounded-xl border px-2 py-2.5 text-sm', time === s.time ? 'border-rose-600 bg-rose-600 text-white' : 'border-blush-200 hover:bg-blush-50')}>{s.time}</button>
                    ))}
                  </div>
                )}
              </Card>

              <Card>
                <h2 className="mb-3 text-2xl">4. Catatan (opsional)</h2>
                <Textarea maxLength={500} placeholder="Contoh: kulit sensitif, alergi produk tertentu…" value={notes} onChange={(e) => setNotes(e.target.value)} aria-label="Catatan tambahan" />
              </Card>
            </>
          )}
        </div>

        <aside>
          <Card className="sticky top-6">
            <h2 className="text-2xl">Ringkasan</h2>
            {!service ? <p className="mt-3 text-sm text-mist">Pilih layanan untuk melihat ringkasan.</p> : (
              <dl className="mt-4 space-y-3 text-sm">
                <Row k="Layanan" v={service.name} />
                <Row k="Terapis" v={staff?.name || 'Ditentukan salon'} />
                <Row k="Tanggal" v={date ? formatDate(date) : '-'} />
                <Row k="Waktu" v={time || 'Belum dipilih'} />
                <Row k="Durasi" v={`${service.duration_min} menit`} icon={Clock} />
                <div className="flex justify-between border-t border-blush-100 pt-3 text-base"><dt>Harga</dt><dd className="font-display text-2xl text-rose-700">{rupiah(service.price)}</dd></div>
              </dl>
            )}
            <Button className="mt-5 w-full" disabled={!service || !time} onClick={() => setConfirmOpen(true)}><CalendarCheck className="h-4 w-4" />Konfirmasi reservasi</Button>
            <p className="mt-3 text-xs text-mist">Pembayaran dilakukan di salon dan dicatat oleh admin. Salon akan mengonfirmasi reservasi Anda.</p>
          </Card>
        </aside>
      </div>
      <ConfirmDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} loading={saving} onConfirm={submit} confirmText="Ya, buat reservasi" title="Buat reservasi ini?"
        message={service ? `${service.name} pada ${formatDate(date)} pukul ${time}${staff ? ` bersama ${staff.name}` : ''}. Total ${rupiah(service.price)}.` : ''} />
    </>
  );
}

const Row = ({ k, v }) => <div className="flex justify-between gap-4"><dt className="text-mist">{k}</dt><dd className="text-right font-medium">{v}</dd></div>;
