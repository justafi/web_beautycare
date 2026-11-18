'use client';
import { ExternalLink } from 'lucide-react';

const DEFAULT_ADDRESS = 'Jl. Pemuda No. 123, Semarang, Jawa Tengah';

export default function SalonMap({ address, className = 'h-48' }) {
  const addr = address || DEFAULT_ADDRESS;
  const embedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(addr)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-blush-100 bg-blush-50">
      <iframe
        src={embedSrc}
        className={`w-full ${className}`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Lokasi BeautyCare di Google Maps"
        allowFullScreen
        style={{ border: 0 }}
      />
      <div className="flex justify-end px-3 py-1.5">
        <a
          href={mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 hover:underline"
        >
          Buka di Google Maps
          <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
      </div>
    </div>
  );
}
