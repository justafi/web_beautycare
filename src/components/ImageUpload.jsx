'use client';
import { ImagePlus, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { BUCKET, assetUrl } from '@/lib/assets';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '../context/ToastContext.jsx';
import { Button, SmartImage } from './ui.jsx';

const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX = 2 * 1024 * 1024;

export default function ImageUpload({ folder, value, onChange, label = 'Foto' }) {
  const toast = useToast();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!TYPES[file.type]) return toast.error('Format foto harus JPG, PNG, atau WebP.');
    if (file.size > MAX) return toast.error('Ukuran foto maksimal 2 MB.');
    setBusy(true);
    try {
      const path = `${folder}/${crypto.randomUUID()}.${TYPES[file.type]}`;
      const { error } = await createClient().storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      onChange(path);
      toast.success('Foto berhasil diunggah.');
    } catch (err) {
      toast.error(`Gagal mengunggah foto: ${err.message}`);
    } finally { setBusy(false); }
  };

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">{label}</p>
      <div className="flex items-center gap-4">
        <SmartImage src={assetUrl(value)} alt="Pratinjau foto" className="h-20 w-20 rounded-2xl" iconSize="h-6 w-6" />
        <div className="space-y-2">
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={pick} aria-label={`Pilih ${label}`} />
          <Button type="button" variant="outline" size="sm" loading={busy} onClick={() => input.current?.click()}><ImagePlus className="h-4 w-4" />{value ? 'Ganti foto' : 'Unggah foto'}</Button>
          {value && <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}><Trash2 className="h-4 w-4" />Hapus</Button>}
          <p className="text-xs text-mist">JPG, PNG, atau WebP, maksimal 2 MB.</p>
        </div>
      </div>
    </div>
  );
}
