'use client';
import { createClient } from '@/lib/supabase/client';
import { assetUrl } from '@/lib/assets';
import { addDays, todayWIB } from '@/lib/format';

const sb = () => createClient();
const ACTIVE = ['pending', 'confirmed', 'in_progress'];

export const fail = (status, message, fields = {}) =>
  Object.assign(new Error(message), { response: { status, data: { message, errors: fields } } });
export const parseError = (err) => ({
  message: err?.response?.data?.message || err?.message || 'Terjadi kesalahan.',
  fields: err?.response?.data?.errors || {},
});

function check(error) {
  if (!error) return;
  const m = error.message || '';
  if (error.code === '42501' && /row-level security/i.test(m)) throw fail(403, 'Anda tidak memiliki akses atau izin untuk tindakan ini.');
  if (error.code === '42501') throw fail(403, m);
  if (error.code === '23505') throw fail(409, 'Data sudah ada (duplikat).');
  if (error.code === '23514') throw fail(422, 'Data tidak valid (melanggar aturan database).');
  if (error.code === '23503') throw fail(409, 'Data masih dipakai oleh data lain.');
  if (error.code === '23P01') throw fail(409, 'Jadwal bentrok dengan reservasi lain.');
  if (error.code === 'P0001') throw fail(409, m);
  if (/fetch|network/i.test(m)) throw fail(0, 'Tidak dapat terhubung ke server. Periksa koneksi Anda.');
  throw fail(500, m || 'Terjadi kesalahan.');
}

const startOf = (d) => `${d}T00:00:00+07:00`;
const endOf = (d) => `${d}T23:59:59.999+07:00`;
export function wib(iso) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}
const hm = (t) => (t ? String(t).slice(0, 5) : t);
const clean = (s) => String(s).replace(/[,()%*\\]/g, ' ').trim();
const weekRange = (date) => {
  const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
  const start = addDays(date, -((dow + 6) % 7));
  return { start, end: addDays(start, 6) };
};
const uid = async () => (await sb().auth.getSession()).data.session?.user?.id || null;

const RES_SELECT = '*, staff:staff_profiles(name, photo_path), payment:payments(id, status, total, discount, method, paid_at, amount, note)';
function mapRes(r) {
  const pay = Array.isArray(r.payment) ? r.payment[0] : r.payment;
  const s = wib(r.start_at);
  const e = wib(r.end_at);
  return {
    id: r.id, code: r.code, customer_id: r.customer_id, staff_id: r.staff_id, service_id: r.service_id,
    status: r.status, notes: r.notes, service_name: r.service_name_snapshot, price: Number(r.price_snapshot),
    duration_min: r.duration_snapshot, date: s.date, start_time: s.time, end_time: e.time, start_at: r.start_at,
    customer_name: r.customer_name, customer_phone: r.customer_phone, customer_email: r.customer_email,
    staff_name: r.staff?.name, staff_photo: assetUrl(r.staff?.photo_path),
    payment_id: pay?.id, payment_status: pay?.status, payment_total: pay ? Number(pay.total) : null,
    payment_discount: pay ? Number(pay.discount) : null, payment_method: pay?.method, paid_at: pay?.paid_at,
  };
}
const mapService = (r) => ({ ...r, price: Number(r.price), photo_url: assetUrl(r.photo_path), is_active: r.is_active ? 1 : 0 });
const fmtHour = (h) => ({ day_of_week: h.day_of_week, open_time: hm(h.open_time), close_time: hm(h.close_time), is_closed: h.is_closed ? 1 : 0 });

async function fetchReservation(id) {
  const { data, error } = await sb().from('reservations').select(RES_SELECT).eq('id', id).maybeSingle();
  check(error);
  if (!data) throw fail(404, 'Reservasi tidak ditemukan.');
  return mapRes(data);
}
async function adminFetch(method, url, body) {
  let r;
  try {
    r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  } catch { throw fail(0, 'Tidak dapat terhubung ke server. Periksa koneksi Anda.'); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw fail(r.status, j.message || 'Terjadi kesalahan.', j.errors || {});
  return j;
}
async function verifyPassword(pw) {
  const { data } = await sb().auth.getUser();
  const { error } = await sb().auth.signInWithPassword({ email: data.user.email, password: pw });
  if (error) throw fail(422, 'Password saat ini salah.', { current_password: 'Password saat ini salah' });
}

const table = { GET: [], POST: [], PUT: [], PATCH: [], DELETE: [] };
const on = (method, pattern, fn) => table[method].push([new RegExp(`^${pattern}$`), fn]);
async function call(method, url, { params = {}, data = {} } = {}) {
  const path = url.split('?')[0];
  for (const [re, fn] of table[method]) {
    const m = path.match(re);
    if (m) return { data: await fn({ params, body: data, args: m.slice(1) }) };
  }
  throw fail(404, 'Endpoint tidak ditemukan.');
}
export const api = {
  get: (u, o) => call('GET', u, o),
  post: (u, d) => call('POST', u, { data: d }),
  put: (u, d) => call('PUT', u, { data: d }),
  patch: (u, d) => call('PATCH', u, { data: d }),
  delete: (u) => call('DELETE', u),
};

on('GET', '/salon', async () => {
  const [a, b, c] = await Promise.all([
    sb().from('salon_profile').select('*').eq('id', 1).maybeSingle(),
    sb().from('business_hours').select('*').order('day_of_week'),
    sb().from('holidays').select('holiday_date, name').gte('holiday_date', todayWIB()).order('holiday_date').limit(10),
  ]);
  check(a.error || b.error || c.error);
  if (!a.data) throw fail(500, 'Data salon belum diisi. Jalankan "npm run seed".');
  const salon = { ...a.data, gallery: (a.data.gallery || []).map(assetUrl) };
  return { salon, hours: b.data.map(fmtHour), holidays: c.data.map((h) => ({ date: h.holiday_date, name: h.name })) };
});

on('GET', '/services', async ({ params }) => {
  let q = sb().from('services').select('*').eq('is_active', true).order('category').order('name');
  if (params.search) { const s = clean(params.search); q = q.or(`name.ilike.%${s}%,description.ilike.%${s}%`); }
  if (params.category) q = q.eq('category', params.category);
  const { data, error } = await q;
  check(error);
  return { services: data.map(mapService) };
});
on('GET', '/services/categories', async () => {
  const { data, error } = await sb().from('services').select('category').eq('is_active', true);
  check(error);
  return { categories: [...new Set(data.map((x) => x.category))].sort() };
});
on('GET', '/staff', async () => {
  const { data, error } = await sb().from('staff_profiles')
    .select('id, name, title, specialization, bio, photo_path, staff_services(service:services(id, name, is_active))')
    .eq('is_active', true).order('name');
  check(error);
  return {
    staff: data.map((s) => ({
      id: s.id, name: s.name, title: s.title, specialization: s.specialization, bio: s.bio, photo_url: assetUrl(s.photo_path),
      services: (s.staff_services || []).map((x) => x.service).filter((x) => x && x.is_active).map((x) => ({ id: x.id, name: x.name })),
    })),
  };
});
on('GET', '/slots', async ({ params }) => {
  const { data, error } = await sb().rpc('get_available_slots', {
    p_service: params.service_id, p_staff: params.staff_id || null, p_date: params.date, p_exclude: params.exclude_id || null,
  });
  check(error);
  return { date: params.date, slots: data.map((s) => ({ time: hm(s.slot), staff_ids: s.staff_ids })) };
});

on('PUT', '/auth/me', async ({ body }) => {
  const { error } = await sb().from('profiles').update({ full_name: body.name, phone: body.phone }).eq('id', await uid());
  check(error);
  return { user: { name: body.name, phone: body.phone } };
});
on('PUT', '/auth/me/email', async ({ body }) => {
  await verifyPassword(body.current_password);
  const { error } = await sb().auth.updateUser({ email: body.email });
  if (error) throw fail(422, error.message, { email: error.message });
  return { user: { email: body.email } };
});
on('PUT', '/auth/me/password', async ({ body }) => {
  await verifyPassword(body.current_password);
  const { error } = await sb().auth.updateUser({ password: body.new_password });
  if (error) throw fail(422, error.message, { new_password: error.message });
  return { message: 'Password diubah.' };
});

on('POST', '/reservations', async ({ body }) => {
  const { data, error } = await sb().rpc('create_reservation', {
    p_service: body.service_id, p_staff: body.staff_id || null, p_date: body.date, p_time: body.time, p_notes: body.notes || null,
  });
  check(error);
  return { reservation: await fetchReservation(data) };
});
on('GET', '/reservations/mine', async ({ params }) => {
  let q = sb().from('reservations').select(RES_SELECT).eq('customer_id', await uid());
  if (params.scope === 'active') q = q.in('status', ACTIVE);
  if (params.scope === 'history') q = q.in('status', ['completed', 'cancelled']);
  if (params.status) q = q.eq('status', params.status);
  if (params.from) q = q.gte('start_at', startOf(params.from));
  if (params.to) q = q.lte('start_at', endOf(params.to));
  const { data, error } = await q.order('start_at', { ascending: params.scope === 'active' }).limit(500);
  check(error);
  return { reservations: data.map(mapRes) };
});
on('GET', '/reservations', async ({ params: p }) => {
  const page = Number(p.page || 1);
  const size = Number(p.page_size || 20);
  const select = p.payment_status ? RES_SELECT.replace('payment:payments(', 'payment:payments!inner(') : RES_SELECT;
  let q = sb().from('reservations').select(select, { count: 'exact' });
  if (p.q) { const s = clean(p.q); q = q.or(`code.ilike.%${s}%,customer_name.ilike.%${s}%`); }
  if (p.from) q = q.gte('start_at', startOf(p.from));
  if (p.to) q = q.lte('start_at', endOf(p.to));
  if (p.service_id) q = q.eq('service_id', p.service_id);
  if (p.staff_id) q = q.eq('staff_id', p.staff_id);
  if (p.status) q = q.eq('status', p.status);
  if (p.payment_status) q = q.eq('payment.status', p.payment_status);
  const { data, error, count } = await q.order('start_at', { ascending: false }).range((page - 1) * size, page * size - 1);
  check(error);
  return { reservations: data.map(mapRes), total: count || 0, page, page_size: size };
});
on('GET', '/reservations/([^/]+)', async ({ args }) => {
  const reservation = await fetchReservation(args[0]);
  const { data, error } = await sb().from('reservation_status_history')
    .select('from_status, to_status, note, created_at, changed_by_name').eq('reservation_id', args[0]).order('created_at');
  check(error);
  const history = data.map((h) => ({ ...h, created_at: (({ date, time }) => `${date} ${time}`)(wib(h.created_at)) }));
  return { reservation, history };
});
const changeStatus = async (id, to, note) => {
  const { error } = await sb().rpc('change_status', { p_id: id, p_to: to, p_note: note || null });
  check(error);
  return { reservation: await fetchReservation(id) };
};
on('PATCH', '/reservations/([^/]+)/status', ({ args, body }) => changeStatus(args[0], body.status, body.note));
on('POST', '/reservations/([^/]+)/cancel', ({ args, body }) => changeStatus(args[0], 'cancelled', body?.note || 'Dibatalkan'));
on('PATCH', '/reservations/([^/]+)/reschedule', async ({ args, body }) => {
  const { error } = await sb().rpc('reschedule_reservation', { p_id: args[0], p_date: body.date, p_time: body.time, p_staff: body.staff_id || null });
  check(error);
  return { reservation: await fetchReservation(args[0]) };
});

on('GET', '/staff-me/reservations', async ({ params }) => {
  const from = params.from || todayWIB();
  const to = params.to || from;
  let q = sb().from('reservations').select(RES_SELECT).gte('start_at', startOf(from)).lte('start_at', endOf(to));
  if (params.status) q = q.eq('status', params.status);
  const { data, error } = await q.order('start_at', { ascending: true }).limit(500);
  check(error);
  return { reservations: data.map(mapRes) };
});
on('GET', '/staff-me/summary', async () => {
  const today = todayWIB();
  const wr = weekRange(today);
  const { data, error } = await sb().from('reservations').select('start_at, status')
    .neq('status', 'cancelled').gte('start_at', startOf(wr.start)).lte('start_at', endOf(wr.end));
  check(error);
  const rows = data.map((r) => ({ date: wib(r.start_at).date, status: r.status }));
  const count = (list) => ({ total: list.length, done: list.filter((r) => r.status === 'completed').length });
  return { today: count(rows.filter((r) => r.date === today)), week: count(rows), week_range: wr };
});
on('GET', '/staff-me/breaks', async () => {
  const { data: me, error: e1 } = await sb().from('staff_profiles').select('id, can_manage_availability').eq('user_id', await uid()).maybeSingle();
  check(e1);
  if (!me) throw fail(404, 'Profil staf tidak ditemukan.');
  const { data, error } = await sb().from('staff_breaks').select('*').eq('staff_id', me.id).order('day_of_week').order('start_time');
  check(error);
  return { breaks: data.map((b) => ({ ...b, start_time: hm(b.start_time), end_time: hm(b.end_time) })), can_manage: me.can_manage_availability };
});
on('POST', '/staff-me/breaks', async ({ body }) => {
  const { data: me } = await sb().from('staff_profiles').select('id').eq('user_id', await uid()).maybeSingle();
  const { error } = await sb().from('staff_breaks').insert({
    staff_id: me?.id, day_of_week: body.day_of_week ?? null, start_time: body.start_time, end_time: body.end_time, label: body.label || 'Istirahat',
  });
  if (error?.code === '42501') throw fail(403, 'Anda belum diberi izin mengelola ketersediaan oleh admin.');
  check(error);
  return { message: 'Waktu istirahat ditambahkan.' };
});
on('DELETE', '/staff-me/breaks/([^/]+)', async ({ args }) => {
  const { error } = await sb().from('staff_breaks').delete().eq('id', args[0]);
  check(error);
  return { message: 'Waktu istirahat dihapus.' };
});

on('GET', '/admin/dashboard', async ({ params }) => {
  const today = todayWIB();
  const period = params.period === 'monthly' ? 'monthly' : 'daily';
  const cnt = async (fn) => {
    const { count, error } = await fn(sb().from('reservations').select('id', { count: 'exact', head: true }));
    check(error);
    return count || 0;
  };
  const todayTotal = await cnt((q) => q.gte('start_at', startOf(today)).lte('start_at', endOf(today)).neq('status', 'cancelled'));
  const pending = await cnt((q) => q.eq('status', 'pending'));
  const completed = await cnt((q) => q.eq('status', 'completed'));
  const paid = await sb().from('payments').select('total').eq('status', 'paid').limit(10000);
  check(paid.error);
  const revenue = paid.data.reduce((a, p) => a + Number(p.total), 0);

  const all = await sb().from('reservations').select('start_at, service_name_snapshot').neq('status', 'cancelled').limit(10000);
  check(all.error);
  const rows = all.data.map((r) => ({ date: wib(r.start_at).date, name: r.service_name_snapshot }));
  let chart;
  if (period === 'daily') {
    const from = addDays(today, -13);
    const m = {};
    rows.forEach((r) => { if (r.date >= from && r.date <= today) m[r.date] = (m[r.date] || 0) + 1; });
    chart = Array.from({ length: 14 }, (_, i) => { const d = addDays(from, i); return { label: d.slice(5), total: m[d] || 0 }; });
  } else {
    const [y, mo] = today.split('-').map(Number);
    const months = Array.from({ length: 6 }, (_, i) => new Date(Date.UTC(y, mo - 1 - (5 - i), 1)).toISOString().slice(0, 7));
    const m = {};
    rows.forEach((r) => { const k = r.date.slice(0, 7); m[k] = (m[k] || 0) + 1; });
    chart = months.map((k) => ({ label: k, total: m[k] || 0 }));
  }
  const pop = {};
  rows.forEach((r) => { pop[r.name] = (pop[r.name] || 0) + 1; });
  const popular = Object.entries(pop).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, total]) => ({ name, total }));

  const sched = await sb().from('reservations').select(RES_SELECT).gte('start_at', startOf(today)).lte('start_at', endOf(today))
    .neq('status', 'cancelled').order('start_at').limit(200);
  check(sched.error);
  return {
    today,
    stats: { today_total: todayTotal, pending, completed, revenue, paid_count: paid.data.length },
    chart, popular, schedule: sched.data.map(mapRes),
  };
});

on('GET', '/admin/services', async ({ params }) => {
  let q = sb().from('services').select('*').order('category').order('name');
  if (params.search) q = q.ilike('name', `%${clean(params.search)}%`);
  if (params.category) q = q.eq('category', params.category);
  if (params.status === 'active') q = q.eq('is_active', true);
  if (params.status === 'inactive') q = q.eq('is_active', false);
  const { data, error } = await q;
  check(error);
  const cats = await sb().from('services').select('category');
  check(cats.error);
  return { services: data.map(mapService), categories: [...new Set(cats.data.map((c) => c.category))].sort() };
});
const serviceRow = (b) => ({
  name: b.name, category: b.category, description: b.description || null, price: Number(b.price),
  duration_min: Number(b.duration_min), photo_path: b.photo_path || null, is_active: !!b.is_active,
});
on('POST', '/admin/services', async ({ body }) => {
  const { error } = await sb().from('services').insert(serviceRow(body));
  check(error);
  return { message: 'Layanan ditambahkan.' };
});
on('PUT', '/admin/services/([^/]+)', async ({ args, body }) => {
  const { error } = await sb().from('services').update(serviceRow(body)).eq('id', args[0]);
  check(error);
  return { message: 'Layanan diperbarui. Reservasi lama tetap memakai harga saat dibuat.' };
});
on('PATCH', '/admin/services/([^/]+)/active', async ({ args, body }) => {
  const { error } = await sb().from('services').update({ is_active: !!body.is_active }).eq('id', args[0]);
  check(error);
  return { message: 'Status layanan diperbarui.' };
});
on('DELETE', '/admin/services/([^/]+)', async ({ args }) => {
  const used = await sb().from('reservations').select('id', { count: 'exact', head: true }).eq('service_id', args[0]);
  check(used.error);
  if ((used.count || 0) > 0) {
    const { error } = await sb().from('services').update({ is_active: false }).eq('id', args[0]);
    check(error);
    return { message: 'Layanan sudah pernah direservasi, sehingga dinonaktifkan (bukan dihapus).', deactivated: true };
  }
  const { error } = await sb().from('services').delete().eq('id', args[0]);
  check(error);
  return { message: 'Layanan dihapus.' };
});

on('GET', '/admin/staff', async () => {
  const { data, error } = await sb().from('staff_profiles')
    .select('id, user_id, name, title, specialization, bio, photo_path, can_manage_availability, is_active, profile:profiles(email, phone, is_active), staff_services(service_id), staff_schedules(day_of_week, start_time, end_time, is_off), staff_breaks(id, day_of_week, start_time, end_time, label)')
    .order('name');
  check(error);
  return {
    staff: data.map((s) => {
      const pr = Array.isArray(s.profile) ? s.profile[0] : s.profile;
      return {
        id: s.id, user_id: s.user_id, name: s.name, email: pr?.email, phone: pr?.phone, title: s.title,
        specialization: s.specialization, bio: s.bio, photo_path: s.photo_path, photo_url: assetUrl(s.photo_path),
        can_manage_availability: s.can_manage_availability ? 1 : 0, is_active: s.is_active && pr?.is_active !== false,
        service_ids: s.staff_services.map((x) => x.service_id),
        schedules: s.staff_schedules.map((x) => ({ day_of_week: x.day_of_week, start_time: hm(x.start_time), end_time: hm(x.end_time), is_off: x.is_off ? 1 : 0 })),
        breaks: s.staff_breaks.map((b) => ({ ...b, start_time: hm(b.start_time), end_time: hm(b.end_time) })),
      };
    }),
  };
});
on('POST', '/admin/staff', async ({ body }) => adminFetch('POST', '/api/admin/staff', body));
on('PUT', '/admin/staff/([^/]+)', async ({ args, body }) => adminFetch('PUT', `/api/admin/staff/${args[0]}`, body));
on('PATCH', '/admin/staff/([^/]+)/active', async ({ args, body }) => adminFetch('PATCH', `/api/admin/staff/${args[0]}`, { is_active: !!body.is_active }));
on('POST', '/admin/staff/([^/]+)/breaks', async ({ args, body }) => {
  const { error } = await sb().from('staff_breaks').insert({
    staff_id: args[0], day_of_week: body.day_of_week ?? null, start_time: body.start_time, end_time: body.end_time, label: body.label || 'Istirahat',
  });
  check(error);
  return { message: 'Waktu istirahat ditambahkan.' };
});
on('DELETE', '/admin/staff/([^/]+)/breaks/([^/]+)', async ({ args }) => {
  const { error } = await sb().from('staff_breaks').delete().eq('id', args[1]).eq('staff_id', args[0]);
  check(error);
  return { message: 'Waktu istirahat dihapus.' };
});

on('GET', '/admin/hours', async () => {
  const [h, s, hol] = await Promise.all([
    sb().from('business_hours').select('*').order('day_of_week'),
    sb().from('salon_profile').select('slot_interval_min, cancel_before_hours, reschedule_before_hours, min_lead_minutes, max_advance_days').eq('id', 1).maybeSingle(),
    sb().from('holidays').select('id, holiday_date, name').order('holiday_date'),
  ]);
  check(h.error || s.error || hol.error);
  return { hours: h.data.map(fmtHour), settings: s.data, holidays: hol.data.map((x) => ({ id: x.id, date: x.holiday_date, name: x.name })) };
});
on('PUT', '/admin/hours', async ({ body }) => {
  const rows = body.hours.map((h) => ({ day_of_week: h.day_of_week, open_time: h.open_time, close_time: h.close_time, is_closed: !!h.is_closed }));
  const a = await sb().from('business_hours').upsert(rows, { onConflict: 'day_of_week' });
  check(a.error);
  const b = await sb().from('salon_profile').update({
    slot_interval_min: body.slot_interval_min, cancel_before_hours: body.cancel_before_hours,
    reschedule_before_hours: body.reschedule_before_hours, min_lead_minutes: body.min_lead_minutes, max_advance_days: body.max_advance_days,
  }).eq('id', 1);
  check(b.error);
  return { message: 'Pengaturan disimpan.' };
});
on('POST', '/admin/holidays', async ({ body }) => {
  const { error } = await sb().from('holidays').insert({ holiday_date: body.date, name: body.name });
  if (error?.code === '23505') throw fail(409, 'Tanggal tersebut sudah terdaftar sebagai hari libur.');
  check(error);
  return { message: 'Hari libur ditambahkan.' };
});
on('DELETE', '/admin/holidays/([^/]+)', async ({ args }) => {
  const { error } = await sb().from('holidays').delete().eq('id', args[0]);
  check(error);
  return { message: 'Hari libur dihapus.' };
});

const PAY_SELECT = '*, payment:payments!inner(id, amount, discount, total, method, status, paid_at, note)';
function payFilters(q, p) {
  if (p.from) q = q.gte('start_at', startOf(p.from));
  if (p.to) q = q.lte('start_at', endOf(p.to));
  if (p.status) q = q.eq('payment.status', p.status);
  if (p.method) q = q.eq('payment.method', p.method);
  return q;
}
const payRow = (r) => {
  const pay = Array.isArray(r.payment) ? r.payment[0] : r.payment;
  return {
    id: pay.id, reservation_id: r.id, code: r.code, customer_name: r.customer_name, service_name: r.service_name_snapshot,
    reservation_status: r.status, date: wib(r.start_at).date, amount: Number(pay.amount), discount: Number(pay.discount),
    total: Number(pay.total), method: pay.method, status: pay.status, paid_at: pay.paid_at, note: pay.note,
  };
};
on('GET', '/admin/payments', async ({ params: p }) => {
  const page = Number(p.page || 1);
  const size = Number(p.page_size || 20);
  const list = await payFilters(sb().from('reservations').select(PAY_SELECT, { count: 'exact' }), p)
    .order('start_at', { ascending: false }).range((page - 1) * size, page * size - 1);
  check(list.error);
  const sum = await payFilters(sb().from('reservations').select('status, payment:payments!inner(status, total)'), p).limit(10000);
  check(sum.error);
  const s = { revenue: 0, paid_count: 0, pending_amount: 0, refunded: 0 };
  sum.data.forEach((r) => {
    const pay = Array.isArray(r.payment) ? r.payment[0] : r.payment;
    const t = Number(pay.total);
    if (pay.status === 'paid') { s.revenue += t; s.paid_count += 1; }
    if (pay.status === 'unpaid' && r.status !== 'cancelled') s.pending_amount += t;
    if (pay.status === 'refunded') s.refunded += t;
  });
  return { payments: list.data.map(payRow), total: list.count || 0, page, page_size: size, summary: s };
});
on('PATCH', '/admin/payments/([^/]+)', async ({ args, body }) => {
  const { error } = await sb().from('payments').update({
    discount: Number(body.discount || 0), method: body.status === 'unpaid' ? null : body.method || null, status: body.status, note: body.note || null,
  }).eq('id', args[0]);
  check(error);
  return { message: 'Pembayaran dicatat.' };
});
const csvCell = (v) => {
  let s = v === null || v === undefined ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; 
  return `"${s.replaceAll('"', '""')}"`;
};
on('GET', '/admin/payments/export.csv', async ({ params: p }) => {
  const { data, error } = await payFilters(sb().from('reservations').select(PAY_SELECT), p).order('start_at', { ascending: false }).limit(10000);
  check(error);
  const head = ['Kode', 'Tanggal', 'Pelanggan', 'Layanan', 'Harga', 'Diskon', 'Total', 'Metode', 'Status', 'Dibayar pada'];
  const lines = [head.map(csvCell).join(',')];
  data.map(payRow).forEach((r) => lines.push([r.code, r.date, r.customer_name, r.service_name, r.amount, r.discount, r.total, r.method, r.status, r.paid_at].map(csvCell).join(',')));
  return new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
});
