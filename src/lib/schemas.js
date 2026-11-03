import { z } from 'zod';

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format jam harus HH:MM');
const password = z.string().min(8, 'Password minimal 8 karakter').max(72)
  .regex(/[A-Za-z]/, 'Password harus mengandung huruf').regex(/\d/, 'Password harus mengandung angka');
const bool = z.union([z.boolean(), z.number()]).transform((v) => !!v);
const schedule = z.object({
  day_of_week: z.coerce.number().int().min(0).max(6), start_time: time, end_time: time, is_off: bool.default(false),
}).refine((s) => s.is_off || s.end_time > s.start_time, { message: 'Jam selesai harus setelah jam mulai', path: ['end_time'] });

const common = {
  name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(100),
  email: z.string().trim().toLowerCase().email('Email tidak valid').max(150),
  phone: z.string().trim().regex(/^(\+62|62|0)8\d{7,12}$/, 'Nomor telepon tidak valid'),
  title: z.string().trim().min(2, 'Jabatan wajib diisi').max(100),
  specialization: z.string().trim().min(2, 'Spesialisasi wajib diisi').max(150),
  bio: z.string().trim().max(1000).optional().nullable(),
  photo_path: z.string().trim().max(300).optional().nullable().transform((v) => v || null),
  can_manage_availability: bool.optional().default(false),
  service_ids: z.array(z.string().uuid()).default([]),
  schedules: z.array(schedule).max(7).optional(),
};
export const staffCreate = z.object({ ...common, password });
export const staffUpdate = z.object({ ...common, password: password.optional().or(z.literal('').transform(() => undefined)) });
export const activeBody = z.object({ is_active: bool });

export const DEFAULT_SCHEDULE = [0, 1, 2, 3, 4, 5, 6].map((d) => ({ day_of_week: d, start_time: '09:00', end_time: '17:00', is_off: d === 0 }));

export function zodErrors(error) {
  const errors = {};
  for (const i of error.issues) { const k = i.path.join('.') || '_'; if (!errors[k]) errors[k] = i.message; }
  return errors;
}
