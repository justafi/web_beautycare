export async function fetchProfile(sb) {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data: p } = await sb.from('profiles').select('id, full_name, email, phone, role, is_active').eq('id', user.id).maybeSingle();
  if (!p || !p.is_active) return null;
  let staffId = null;
  let canManageAvailability = false;
  if (p.role === 'staff') {
    const { data: s } = await sb.from('staff_profiles').select('id, can_manage_availability, is_active').eq('user_id', user.id).maybeSingle();
    if (!s || !s.is_active) return null;
    staffId = s.id;
    canManageAvailability = s.can_manage_availability;
  }
  return { id: p.id, name: p.full_name, email: p.email || user.email, phone: p.phone, role: p.role, staffId, canManageAvailability };
}
