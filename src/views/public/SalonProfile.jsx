'use client';
import { Check, Clock, MapPin, Phone } from 'lucide-react';
import { HoursList } from '../../components/Layouts.jsx';
import { Card, ErrorState, SmartImage, Spinner } from '../../components/ui.jsx';
import { useFetch } from '../../lib/useFetch.js';

export default function SalonProfile() {
  const { data, loading, error, reload } = useFetch('/salon');
  if (loading) return <Spinner />;
  if (error) return <div className="mx-auto max-w-xl p-8"><ErrorState message={error} onRetry={reload} /></div>;
  const { salon: s, hours, holidays } = data;
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-5xl">{s.name}</h1>
      <p className="mt-4 max-w-2xl text-lg text-mist">{s.description}</p>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 flex items-center gap-2 text-3xl"><MapPin className="h-5 w-5 text-rose-600" aria-hidden />Kontak</h2>
          <p className="text-sm text-mist">{s.address}</p>
          <p className="mt-2 flex items-center gap-2 text-sm text-mist"><Phone className="h-4 w-4" aria-hidden />{s.phone}</p>
          <p className="mt-1 text-sm text-mist">{s.email}</p>
          {s.instagram && <p className="mt-1 text-sm text-mist">{s.instagram}</p>}
        </Card>
        <Card>
          <h2 className="mb-3 flex items-center gap-2 text-3xl"><Clock className="h-5 w-5 text-rose-600" aria-hidden />Jam operasional</h2>
          <HoursList hours={hours} />
          {holidays.length > 0 && <p className="mt-3 text-xs text-mist">Libur mendatang: {holidays.map((h) => `${h.date} (${h.name})`).join(', ')}</p>}
        </Card>
      </div>
      {s.facilities?.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-4xl">Fasilitas</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {s.facilities.map((f) => <li key={f} className="flex items-center gap-2 rounded-2xl bg-white p-4 text-sm shadow-soft"><Check className="h-4 w-4 text-rose-600" aria-hidden />{f}</li>)}
          </ul>
        </section>
      )}
      {s.gallery?.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-4xl">Galeri</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {s.gallery.map((g, i) => <SmartImage key={i} src={g} alt={`Foto galeri ${i + 1}`} className="h-48 w-full rounded-3xl" />)}
          </div>
        </section>
      )}
    </div>
  );
}
