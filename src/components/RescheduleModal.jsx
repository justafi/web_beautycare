'use client';
import { useEffect, useState } from 'react';
import { api, parseError } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { addDays, formatDate, todayWIB } from '../lib/format.js';
import { Button, Field, Input, Modal, Select, Spinner } from './ui.jsx';

export default function RescheduleModal({ reservation, canChangeStaff, onClose, onDone }) {
  const toast = useToast();
  const [date, setDate] = useState(reservation?.date || todayWIB());
  const [staffId, setStaffId] = useState(reservation?.staff_id);
  const [staffList, setStaffList] = useState([]);
  const [slots, setSlots] = useState([]);
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!reservation || !canChangeStaff) return;
    api.get('/staff').then((r) => setStaffList(r.data.staff.filter((s) => s.services.some((x) => x.id === reservation.service_id))));
  }, [reservation, canChangeStaff]);

  useEffect(() => {
    if (!reservation) return;
    setLoading(true); setTime('');
    api.get('/slots', { params: { service_id: reservation.service_id, staff_id: staffId, date, exclude_id: reservation.id } })
      .then((r) => setSlots(r.data.slots)).catch((e) => toast.error(parseError(e).message)).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservation, date, staffId]);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`/reservations/${reservation.id}/reschedule`, { date, time, staff_id: staffId });
      toast.success('Jadwal berhasil diubah.');
      onDone();
    } catch (e) { toast.error(parseError(e).message); } finally { setSaving(false); }
  };

  return (
    <Modal open={!!reservation} onClose={onClose} title="Ubah jadwal">
      {reservation && (
        <div className="space-y-4">
          <p className="text-sm text-mist">{reservation.service_name} · {reservation.code}<br />Jadwal saat ini: {formatDate(reservation.date)}, {reservation.start_time}</p>
          {canChangeStaff && (
            <Field label="Terapis">
              <Select value={staffId} onChange={(e) => setStaffId(e.target.value)}>
                {staffList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </Field>
          )}
          <Field label="Tanggal baru"><Input type="date" min={todayWIB()} max={addDays(todayWIB(), 365)} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <div>
            <p className="mb-1.5 text-sm font-medium">Waktu tersedia</p>
            {loading ? <Spinner label="Mencari slot…" /> : slots.length === 0 ? (
              <p className="rounded-xl bg-blush-50 p-3 text-sm text-mist">Tidak ada slot pada tanggal ini. Coba tanggal lain.</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {slots.map((s) => (
                  <button key={s.time} onClick={() => setTime(s.time)} aria-pressed={time === s.time}
                    className={`rounded-xl border px-2 py-2 text-sm ${time === s.time ? 'border-rose-600 bg-rose-600 text-white' : 'border-blush-200 hover:bg-blush-50'}`}>{s.time}</button>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>Batal</Button>
            <Button disabled={!time} loading={saving} onClick={save}>Simpan jadwal</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
