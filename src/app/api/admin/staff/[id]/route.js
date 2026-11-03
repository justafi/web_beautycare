import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminGuard';
import { activeBody, staffUpdate, zodErrors } from '@/lib/schemas';
import { createAdminClient } from '@/lib/supabase/admin';

const json = (body, status = 200) => NextResponse.json(body, { status });
const isUuid = (v) => /^[0-9a-f-]{36}$/i.test(v);

async function loadStaff(admin, id) {
  if (!isUuid(id)) return null;
  const { data } = await admin.from('staff_profiles').select('id, user_id').eq('id', id).maybeSingle();
  return data;
}

export async function PUT(req, { params }) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  const parsed = staffUpdate.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return json({ message: 'Data yang dikirim tidak valid.', errors: zodErrors(parsed.error) }, 422);
  const b = parsed.data;
  const admin = createAdminClient();
  const staff = await loadStaff(admin, params.id);
  if (!staff) return json({ message: 'Staf tidak ditemukan.' }, 404);

  const authUpdate = { email: b.email, user_metadata: { full_name: b.name, phone: b.phone } };
  if (b.password) authUpdate.password = b.password;
  const a = await admin.auth.admin.updateUserById(staff.user_id, authUpdate);
  if (a.error) {
    const dup = /already|registered|exists/i.test(a.error.message);
    return json({ message: dup ? 'Email sudah dipakai akun lain.' : a.error.message, errors: dup ? { email: 'Email sudah dipakai' } : {} }, dup ? 409 : 422);
  }
  const p1 = await admin.from('profiles').update({ full_name: b.name, phone: b.phone, email: b.email }).eq('id', staff.user_id);
  const p2 = await admin.from('staff_profiles').update({
    name: b.name, title: b.title, specialization: b.specialization, bio: b.bio || null,
    photo_path: b.photo_path, can_manage_availability: b.can_manage_availability,
  }).eq('id', staff.id);
  if (p1.error || p2.error) return json({ message: 'Gagal menyimpan perubahan.' }, 500);

  await admin.from('staff_services').delete().eq('staff_id', staff.id);
  if (b.service_ids.length) {
    const r = await admin.from('staff_services').insert(b.service_ids.map((service_id) => ({ staff_id: staff.id, service_id })));
    if (r.error) return json({ message: 'Layanan yang dipilih tidak valid.' }, 422);
  }
  if (b.schedules) {
    const r = await admin.from('staff_schedules').upsert(b.schedules.map((s) => ({ staff_id: staff.id, ...s })), { onConflict: 'staff_id,day_of_week' });
    if (r.error) return json({ message: 'Jadwal kerja tidak valid.' }, 422);
  }
  return json({ message: 'Data staf diperbarui.' });
}

export async function PATCH(req, { params }) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  const parsed = activeBody.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return json({ message: 'Data yang dikirim tidak valid.' }, 422);
  const admin = createAdminClient();
  const staff = await loadStaff(admin, params.id);
  if (!staff) return json({ message: 'Staf tidak ditemukan.' }, 404);
  const active = parsed.data.is_active;
  const r1 = await admin.from('staff_profiles').update({ is_active: active }).eq('id', staff.id);
  const r2 = await admin.from('profiles').update({ is_active: active }).eq('id', staff.user_id);
  const r3 = await admin.auth.admin.updateUserById(staff.user_id, { ban_duration: active ? 'none' : '876000h' });
  if (r1.error || r2.error || r3.error) return json({ message: 'Gagal mengubah status akun.' }, 500);
  return json({ message: active ? 'Akun staf diaktifkan.' : 'Akun staf dinonaktifkan.' });
}
