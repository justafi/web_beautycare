import { Cormorant_Garamond, Jost } from 'next/font/google';
import Providers from '@/components/Providers';
import { getProfile } from '@/lib/supabase/server';
import './globals.css';

const display = Cormorant_Garamond({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-display', display: 'swap' });
const body = Jost({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-body', display: 'swap' });

export const metadata = {
  title: 'BeautyCare - Reservasi Salon & Klinik Kecantikan',
  description: 'Reservasi layanan salon dan klinik kecantikan secara online.',
};
export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }) {
  const user = await getProfile();
  return (
    <html lang="id" className={`${display.variable} ${body.variable}`}>
      <body>
        <Providers initialUser={user}>{children}</Providers>
      </body>
    </html>
  );
}
