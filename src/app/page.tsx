'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CreateTournamentModal from '@/components/CreateTournamentModal';

interface Tournament {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  _count: { groups: number };
  groups: Array<{ _count: { teams: number; matches: number } }>;
}

export default function HomePage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch('/api/tournaments');
        const data = await res.json();
        if (!ignore) {
          setTournaments(data.tournaments || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleCreated = (id: string) => {
    setShowCreate(false);
    router.push(`/tournament/${id}`);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'GROUP_STAGE': return 'Group Stage';
      case 'KNOCKOUT': return 'Knockout';
      case 'COMPLETE': return 'Complete';
      default: return 'Setup';
    }
  };

  const getTotalMatches = (t: Tournament) =>
    t.groups.reduce((acc, g) => acc + g._count.matches, 0);
  const getTotalTeams = (t: Tournament) =>
    t.groups.reduce((acc, g) => acc + g._count.teams, 0);

  return (
    <main className="page-container">
      {/* Hero */}
      <div className="hero">
        <h1 className="hero-title">Pickleball Tournament Manager</h1>
        <p className="hero-subtitle">
          Manage round-robin group stages, track live scores, and run knockout brackets — all in one place.
        </p>
        <button className="btn btn-primary btn-lg" onClick={() => setShowCreate(true)}>
          <span>+</span> Create New Tournament
        </button>
      </div>

      {/* Tournament List */}
      <div className="section-header">
        <h2 className="section-title">
          🎯 Tournaments
          {!loading && <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 400 }}>({tournaments.length})</span>}
        </h2>
        {tournaments.length > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={() => setShowCreate(true)}>
            + New Tournament
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: '200px' }}>
          <div className="spinner" />
          <span>Loading tournaments…</span>
        </div>
      ) : tournaments.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">🏓</div>
            <h3>No tournaments yet</h3>
            <p>Create your first pickleball tournament to get started</p>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              Create Tournament
            </button>
          </div>
        </div>
      ) : (
        <div className="tournaments-grid">
          {tournaments.map((t) => (
            <div
              key={t.id}
              className="card card-hover tournament-card animate-in"
              onClick={() => router.push(`/tournament/${t.id}`)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{t.name}</h3>
                <span className={`tournament-status-badge status-${t.status.toLowerCase()}`}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                  {getStatusLabel(t.status)}
                </span>
              </div>
              <div className="tournament-meta">
                <span>⚡ {t._count.groups} Groups</span>
                <span>👥 {getTotalTeams(t)} Teams</span>
                <span>🎮 {getTotalMatches(t)} Matches</span>
              </div>
              <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateTournamentModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </main>
  );
}
