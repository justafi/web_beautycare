'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { addDays, todayWIB } from '../lib/format.js';
import { Card, Field, Input, Select, Spinner } from './ui.jsx';

export default function SlotChecker({ services }) {
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState(todayWIB());
  const [slots, setSlots] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (!serviceId && services.length) setServiceId(services[0].id); }, [services, serviceId]);
  useEffect(() => {
    if (!serviceId || !date) return;
    let live = true;
    setLoading(true);
    api.get('/slots', { params: { service_id: serviceId, date } })
      .then((r) => live && setSlots(r.data.slots)).catch(() => live && setSlots([])).finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [serviceId, date]);

  return (
    <Card>
      <h2 className="text-3xl">Cek slot tersedia</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Layanan"><Select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>{services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
        <Field label="Tanggal"><Input type="date" min={todayWIB()} max={addDays(todayWIB(), 60)} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} /></Field>
      </div>
      <div className="mt-4">
        {loading ? <Spinner label="Mencari slot…" /> : !slots?.length ? (
          <p className="rounded-xl bg-blush-50 p-4 text-sm text-mist">Tidak ada slot pada tanggal ini. Coba tanggal lain.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slots.map((s) => (
              <Link key={s.time} href={`/pelanggan?layanan=${serviceId}&tanggal=${date}`} className="rounded-full border border-blush-200 px-4 py-2 text-sm hover:bg-blush-50">{s.time}</Link>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
