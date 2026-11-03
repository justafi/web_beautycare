export const homeFor = (role) => ({ admin: '/admin', staff: '/staff', customer: '/pelanggan' }[role] || '/');
