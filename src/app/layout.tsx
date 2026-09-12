import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
import LogoutButton from '@/components/LogoutButton';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pickleball Tournament Manager',
  description:
    'Manage round-robin pickleball tournaments with knockout promotion. Track scores, standings, and brackets.',
  keywords: 'pickleball, tournament, round robin, knockout, score management',
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const isLoggedIn =
    cookieStore.get('pickleball_session')?.value === 'pickleball_admin_session';

  return (
    <html lang="en">
      <body>
        {isLoggedIn && (
          <nav className="navbar">
            <Link href="/" className="navbar-brand">
              <Image
                src="/logo.jpg"
                alt="PickleGo Logo"
                width={120}
                height={44}
                style={{ height: 44, width: 'auto', borderRadius: '8px', objectFit: 'contain' }}
                priority
              />
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: 'var(--accent)', display: 'inline-block',
                }} />
                picklego@admin.com
              </span>
              <Link
                href="/settings"
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 12px', borderRadius: '8px',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600,
                  textDecoration: 'none', transition: 'all 0.2s',
                }}
              >
                ⚙️ Settings
              </Link>
              <LogoutButton />
            </div>
          </nav>
        )}
        {children}
      </body>
    </html>
  );
}
