'use client';
import { AuthProvider } from '../context/AuthContext.jsx';
import { ToastProvider } from '../context/ToastContext.jsx';

export default function Providers({ initialUser, children }) {
  return (
    <ToastProvider>
      <AuthProvider initialUser={initialUser}>{children}</AuthProvider>
    </ToastProvider>
  );
}
