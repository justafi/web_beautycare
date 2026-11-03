import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminGuard';
import { DEFAULT_SCHEDULE, staffCreate, zodErrors } from '@/lib/schemas';
import { createAdminClient } from '@/lib/supabase/admin';

const json = (body, status = 200) => NextResponse.json(body, { status });

export async function POST(req) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const parsed = staffCreate.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return json({ message: 'Data yang dikirim tidak valid.', errors: zodErrors(parsed.error) }, 422);
  const b = parsed.data;

  const admin = createAdminClient();
  const { data: created, error: e1 } = await admin.auth.admin.createUser({
    email: b.email, password: b.password, email_confirm: true, user_metadata: { full_name: b.name, phone: b.phone },
  });
  if (e1) {
    const dup = /already|registered|exists/i.test(e1.message);
    return json({ message: dup ? 'Email sudah terdaftar.' : e1.message, errors: dup ? { email: 'Email sudah terdaftar' } : {} }, dup ? 409 : 422);
  }
  const userId = created.user.id;
  const rollback = () => admin.auth.admin.deleteUser(userId); 

  const up = await admin.from('profiles').update({ role: 'staff', phone: b.phone }).eq('id', userId);
  if (up.error) { await rollback(); return json({ message: 'Gagal menyimpan profil staf.' }, 500); }

  const sp = await admin.from('staff_profiles').insert({
    user_id: userId, name: b.name, title: b.title, specialization: b.specialization, bio: b.bio || null,
    photo_path: b.photo_path, can_manage_availability: b.can_manage_availability,
  }).select('id').single();
  if (sp.error) { await rollback(); return json({ message: 'Gagal menyimpan profil staf.' }, 500); }
  const staffId = sp.data.id;

  if (b.service_ids.length) {
    const r = await admin.from('staff_services').insert(b.service_ids.map((service_id) => ({ staff_id: staffId, service_id })));
    if (r.error) { await rollback(); return json({ message: 'Layanan yang dipilih tidak valid.' }, 422); }
  }
  const sched = (b.schedules || DEFAULT_SCHEDULE).map((s) => ({ staff_id: staffId, ...s }));
  const r2 = await admin.from('staff_schedules').insert(sched);
  if (r2.error) { await rollback(); return json({ message: 'Jadwal kerja tidak valid.' }, 422); }

  return json({ id: staffId, message: 'Akun staf dibuat.' }, 201);
}
