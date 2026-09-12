'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <button
      id="logout-btn"
      className="btn btn-secondary btn-sm"
      onClick={handleLogout}
      disabled={loading}
      style={{ borderRadius: '8px' }}
    >
      {loading ? '…' : '↩ Logout'}
    </button>
  );
}
