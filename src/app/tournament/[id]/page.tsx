'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import GroupView from '@/components/GroupView';
import KnockoutBracket from '@/components/KnockoutBracket';
import MatchModal from '@/components/MatchModal';
import { computeGroupStandings } from '@/lib/scoring';

interface Team {
  id: string;
  name: string;
  groupId: string;
  group?: { name: string };
}

interface Match {
  id: string;
  groupId: string;
  team1Id: string;
  team2Id: string;
  team1: Team;
  team2: Team;
  winner?: Team;
  winnerId?: string;
  matchType: string;
  scoreType: string;
  status: string;
  team1Score?: number;
  team2Score?: number;
  team1Player1?: string;
  team1Player2?: string;
  team2Player1?: string;
  team2Player2?: string;
  matchNumber: number;
  roundNumber: number;
}

interface KnockoutMatch {
  id: string;
  round: string;
  position: number;
  team1Id?: string;
  team2Id?: string;
  team1?: Team;
  team2?: Team;
  winner?: Team;
  winnerId?: string;
  status: string;
  matchType: string;
  scoreType: string;
  team1Score?: number;
  team2Score?: number;
  team1Player1?: string;
  team1Player2?: string;
  team2Player1?: string;
  team2Player2?: string;
}

interface Group {
  id: string;
  name: string;
  groupNumber: number;
  teams: Team[];
  matches: Match[];
}

interface Tournament {
  id: string;
  name: string;
  status: string;
  matchType?: string;
  createdAt: string;
  groups: Group[];
  knockoutMatches: KnockoutMatch[];
}

type ActiveTab = 'groups' | 'knockout';

export default function TournamentPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('groups');
  const [activeGroupIdx, setActiveGroupIdx] = useState(0);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedKnockoutMatch, setSelectedKnockoutMatch] = useState<KnockoutMatch | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const [advanceError, setAdvanceError] = useState('');

  const fetchTournament = useCallback(async () => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`);
      if (!res.ok) { router.push('/'); return; }
      const data = await res.json();
      setTournament(data.tournament);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [tournamentId, router]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch(`/api/tournaments/${tournamentId}`);
        if (!res.ok) { router.push('/'); return; }
        const data = await res.json();
        if (!ignore) {
          setTournament(data.tournament);
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
  }, [tournamentId, router]);

  // Check if all group matches are done
  const allGroupMatchesDone = tournament?.groups.every(
    (g) => g.matches.every((m) => m.status === 'COMPLETE')
  ) ?? false;

  const totalGroupMatches = tournament?.groups.reduce((a, g) => a + g.matches.length, 0) ?? 0;
  const completedGroupMatches = tournament?.groups.reduce(
    (a, g) => a + g.matches.filter((m) => m.status === 'COMPLETE').length,
    0
  ) ?? 0;

  const handleAdvance = async () => {
    setAdvancing(true);
    setAdvanceError('');
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/advance`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setAdvanceError(data.error); return; }
      await fetchTournament();
      setActiveTab('knockout');
    } catch {
      setAdvanceError('Failed to advance tournament');
    } finally {
      setAdvancing(false);
    }
  };

  const handleMatchSubmit = async () => {
    setSelectedMatch(null);
    setSelectedKnockoutMatch(null);
    await fetchTournament();
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading tournament…</p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-icon">❌</div>
          <h3>Tournament not found</h3>
          <button className="btn btn-secondary" onClick={() => router.push('/')}>Go Home</button>
        </div>
      </div>
    );
  }

  const activeGroup = tournament.groups[activeGroupIdx];

  return (
    <main className="page-container">
      {/* Back Link */}
      <Link href="/" className="back-btn">← All Tournaments</Link>

      {/* Tournament Header */}
      <div className="tournament-header">
        <div className="tournament-header-top">
          <div>
            <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', marginBottom: '0.5rem' }}>
              {tournament.name}
            </h1>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className={`tournament-status-badge status-${tournament.status.toLowerCase()}`}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                {tournament.status === 'GROUP_STAGE' ? 'Group Stage' :
                 tournament.status === 'KNOCKOUT' ? 'Knockout Stage' :
                 tournament.status === 'COMPLETE' ? 'Complete' : 'Setup'}
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                }}
              >
                {tournament.matchType === 'SINGLES' ? '👤 Singles' : '👥 Doubles'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="stats-row" style={{ marginTop: '1rem' }}>
          <div className="stat-pill">⚡ <span className="stat-value">{tournament.groups.length}</span> Groups</div>
          <div className="stat-pill">
            👥 <span className="stat-value">
              {tournament.groups.reduce((acc, g) => acc + g.teams.length, 0)}
            </span> Teams
          </div>
          <div className="stat-pill">🎮 <span className="stat-value">{completedGroupMatches}/{totalGroupMatches}</span> Group Matches</div>
        </div>
      </div>

      {/* Advance Banner */}
      {tournament.status === 'GROUP_STAGE' && allGroupMatchesDone && (
        <div className="progress-banner banner-success animate-in" style={{ marginBottom: '1.5rem' }}>
          <div>
            <p className="banner-text" style={{ color: 'var(--green)', fontWeight: 700 }}>
              🎉 All group matches complete!
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Ready to generate the knockout bracket with group winners.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
            {advanceError && <span style={{ fontSize: '0.78rem', color: 'var(--red)' }}>{advanceError}</span>}
            <button className="btn btn-primary" onClick={handleAdvance} disabled={advancing}>
              {advancing ? 'Generating…' : '⚡ Start Knockout Stage'}
            </button>
          </div>
        </div>
      )}

      {tournament.status === 'GROUP_STAGE' && !allGroupMatchesDone && (
        <div className="progress-banner banner-info" style={{ marginBottom: '1.5rem' }}>
          <span className="banner-text" style={{ color: 'var(--cyan)' }}>
            🎯 {completedGroupMatches} of {totalGroupMatches} group matches completed — enter results below
          </span>
        </div>
      )}

      {tournament.status === 'COMPLETE' && (
        <div className="progress-banner banner-success" style={{ marginBottom: '1.5rem' }}>
          <span className="banner-text" style={{ color: 'var(--green)', fontWeight: 700 }}>
            🏆 Tournament Complete! Check the knockout bracket for the champion.
          </span>
          <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('knockout')}>
            View Bracket →
          </button>
        </div>
      )}

      {/* Main Tabs */}
      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        <button
          className={`tab-btn ${activeTab === 'groups' ? 'active' : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          ⚡ Group Stage
          <span className="tab-count">{tournament.groups.length} groups</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'knockout' ? 'active' : ''}`}
          onClick={() => setActiveTab('knockout')}
          disabled={tournament.status === 'GROUP_STAGE' && tournament.knockoutMatches.length === 0}
        >
          🏆 Knockout Bracket
          {tournament.knockoutMatches.length > 0 && (
            <span className="tab-count">{tournament.knockoutMatches.length} matches</span>
          )}
        </button>
      </div>

      {/* Group Stage */}
      {activeTab === 'groups' && (
        <div className="animate-in">
          {/* Group selector */}
          <div className="group-tabs">
            {tournament.groups.map((group, idx) => {
              const done = group.matches.every((m) => m.status === 'COMPLETE');
              const standings = computeGroupStandings({
                teams: group.teams,
                matches: group.matches.map((m) => ({
                  team1Id: m.team1Id,
                  team2Id: m.team2Id,
                  team1Score: m.team1Score ?? null,
                  team2Score: m.team2Score ?? null,
                  winnerId: m.winnerId ?? null,
                  status: m.status,
                })),
              });
              return (
                <button
                  key={group.id}
                  className={`group-tab-btn ${activeGroupIdx === idx ? 'active' : ''}`}
                  onClick={() => setActiveGroupIdx(idx)}
                >
                  Group {group.name}
                  {done && <span style={{ marginLeft: 4 }}>✓</span>}
                  {done && standings[0] && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 4 }}>
                      ({standings[0].teamName})
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {activeGroup && (
            <GroupView
              group={activeGroup}
              onMatchClick={(match) => setSelectedMatch(match as Match)}
            />
          )}
        </div>
      )}

      {/* Knockout */}
      {activeTab === 'knockout' && (
        <div className="animate-in">
          {tournament.knockoutMatches.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-icon">🏆</div>
                <h3>Knockout bracket not yet generated</h3>
                <p>Complete all group stage matches first, then start the knockout stage.</p>
              </div>
            </div>
          ) : (
            <KnockoutBracket
              matches={tournament.knockoutMatches}
              onMatchClick={(m) => setSelectedKnockoutMatch(m as KnockoutMatch)}
              tournamentStatus={tournament.status}
            />
          )}
        </div>
      )}

      {/* Match Modals */}
      {selectedMatch && (
        <MatchModal
          match={selectedMatch}
          isKnockout={false}
          onClose={() => setSelectedMatch(null)}
          onSubmit={handleMatchSubmit}
        />
      )}

      {selectedKnockoutMatch && (
        <MatchModal
          match={selectedKnockoutMatch as unknown as Match}
          isKnockout={true}
          onClose={() => setSelectedKnockoutMatch(null)}
          onSubmit={handleMatchSubmit}
        />
      )}
    </main>
  );
}
