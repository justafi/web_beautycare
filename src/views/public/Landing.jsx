'use client';
import { ArrowRight, Clock, MapPin, Phone, Quote } from 'lucide-react';
import Link from 'next/link';
import { HoursList } from '../../components/Layouts.jsx';
import { Button, Card, ErrorState, SmartImage, Spinner } from '../../components/ui.jsx';
import { rupiah } from '../../lib/format.js';
import SlotChecker from '../../components/SlotChecker.jsx';
import { useFetch } from '../../lib/useFetch.js';

export default function Landing() {
  const salon = useFetch('/salon');
  const services = useFetch('/services');
  const staff = useFetch('/staff');
  if (salon.loading) return <Spinner />;
  if (salon.error) return <div className="mx-auto max-w-xl p-8"><ErrorState message={salon.error} onRetry={salon.reload} /></div>;
  const { salon: s, hours } = salon.data;
  const gallery = s.gallery || [];
  const featured = (services.data?.services || []).slice(0, 4);
  const mon = hours.find((h) => h.day_of_week === 1);
  const weekdayHours = mon && !mon.is_closed ? `Senin: ${mon.open_time}–${mon.close_time}` : 'Lihat jam operasional di bawah';

  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-10 pt-10 md:grid-cols-2 md:pt-16">
        <div>
          <h1 className="text-5xl leading-[1.05] sm:text-6xl">{s.tagline}</h1>
          <p className="mt-5 max-w-md text-lg text-mist">Pilih layanan, terapis, dan jam yang cocok. Reservasi selesai dalam beberapa menit, tanpa telepon dan tanpa antre.</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/pelanggan"><Button size="lg">Reservasi Sekarang</Button></Link>
            <Link href="/layanan" className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-rose-700 hover:underline">Lihat layanan <ArrowRight className="h-4 w-4" aria-hidden /></Link>
          </div>
          <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-mist">
            <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-rose-600" aria-hidden /><dt className="sr-only">Jam</dt><dd>{weekdayHours}</dd></div>
            <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-rose-600" aria-hidden /><dt className="sr-only">Alamat</dt><dd>{s.address}</dd></div>
          </dl>
        </div>
        <div className="relative">
          <SmartImage src={gallery[0]} alt="Suasana perawatan di BeautyCare" className="aspect-[4/5] w-full rounded-[2.5rem] shadow-soft" iconSize="h-12 w-12" />
          <div className="absolute -bottom-5 left-4 right-4 rounded-3xl bg-white/95 p-4 shadow-soft sm:left-auto sm:right-[-1rem] sm:w-64">
            <p className="font-display text-xl">Hari ini</p>
            <p className="text-sm text-mist">Slot terisi sesuai ketersediaan terapis. Cek jam kosong langsung saat memilih tanggal.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-4"><SlotChecker services={services.data?.services || []} /></section>

      <section className="mx-auto mt-20 max-w-6xl px-4">
        <h2 className="text-4xl">Tentang kami</h2>
        <p className="mt-3 max-w-2xl text-mist">{s.description}</p>
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-4">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-4xl">Layanan unggulan</h2>
          <Link href="/layanan" className="text-sm font-medium text-rose-700 hover:underline">Semua layanan</Link>
        </div>
        {services.loading ? <Spinner /> : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((v) => (
              <Card key={v.id} className="overflow-hidden p-0">
                <SmartImage src={v.photo_url} alt={v.name} className="h-40 w-full" />
                <div className="p-4">
                  <h3 className="text-xl">{v.name}</h3>
                  <p className="mt-1 text-sm text-mist">{v.duration_min} menit · {rupiah(v.price)}</p>
                  <Link href={`/pelanggan?layanan=${v.id}`} className="mt-3 inline-block text-sm font-medium text-rose-700 hover:underline">Pilih layanan</Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-4">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-4xl">Terapis kami</h2>
          <Link href="/terapis" className="text-sm font-medium text-rose-700 hover:underline">Lihat semua</Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {(staff.data?.staff || []).map((t) => (
            <div key={t.id} className="text-center">
              <SmartImage src={t.photo_url} alt={t.name} className="mx-auto h-32 w-32 rounded-full" />
              <p className="mt-3 font-display text-xl">{t.name}</p>
              <p className="text-sm text-mist">{t.specialization}</p>
            </div>
          ))}
        </div>
      </section>

      {gallery.length > 0 && (
        <section className="mx-auto mt-16 max-w-6xl px-4">
          <h2 className="mb-6 text-4xl">Galeri</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {gallery.slice(0, 4).map((g, i) => <SmartImage key={i} src={g} alt={`Foto galeri ${i + 1}`} className={`w-full rounded-3xl ${i === 0 ? 'col-span-2 row-span-2 h-full min-h-48' : 'h-40'}`} />)}
          </div>
        </section>
      )}

      {s.testimonials?.length > 0 && (
        <section className="mx-auto mt-16 max-w-6xl px-4">
          <h2 className="mb-6 text-4xl">Kata pelanggan</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {s.testimonials.map((t, i) => (
              <Card key={i}><Quote className="h-5 w-5 text-rose" aria-hidden /><p className="mt-2 text-sm">{t.text}</p><p className="mt-3 text-sm font-medium text-rose-700">{t.name}</p></Card>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto mt-16 grid max-w-6xl gap-6 px-4 md:grid-cols-2">
        <Card><h2 className="mb-3 text-3xl">Jam operasional</h2><HoursList hours={hours} /></Card>
        <Card>
          <h2 className="mb-3 text-3xl">Alamat & kontak</h2>
          <ul className="space-y-3 text-sm text-mist">
            <li className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-rose-600" aria-hidden />{s.address}</li>
            <li className="flex gap-2"><Phone className="h-4 w-4 shrink-0 text-rose-600" aria-hidden />{s.phone}</li>
          </ul>
          <Link href="/pelanggan"><Button className="mt-6">Reservasi Sekarang</Button></Link>
        </Card>
      </section>
    </>
  );
}
