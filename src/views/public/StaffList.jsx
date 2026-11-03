'use client';
import { Users } from 'lucide-react';
import { Badge, Card, EmptyState, ErrorState, SmartImage, Spinner } from '../../components/ui.jsx';
import { useFetch } from '../../lib/useFetch.js';

export default function StaffList() {
  const { data, loading, error, reload } = useFetch('/staff');
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-5xl">Terapis kami</h1>
      <p className="mt-2 text-mist">Tim berpengalaman dengan keahlian berbeda-beda.</p>
      <div className="mt-8">
        {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : data.staff.length === 0 ? (
          <EmptyState icon={Users} title="Belum ada terapis" text="Data terapis akan tampil di sini." />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.staff.map((s) => (
              <Card key={s.id} className="text-center">
                <SmartImage src={s.photo_url} alt={s.name} className="mx-auto h-28 w-28 rounded-full" />
                <h2 className="mt-4 text-2xl">{s.name}</h2>
                <p className="text-sm text-rose-700">{s.title}</p>
                <p className="mt-1 text-sm text-mist">{s.specialization}</p>
                {s.bio && <p className="mt-3 text-sm text-mist">{s.bio}</p>}
                <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                  {s.services.map((v) => <Badge key={v.id} className="bg-blush-100 text-rose-700">{v.name}</Badge>)}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
