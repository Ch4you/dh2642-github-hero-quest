import { isFirebaseConfigured, subscribeLeaderboard } from '../services/firebaseService.js';

const BADGE_RULES = [
  { label: 'Merge Hero', test: (row) => Number(row.mergedPRs ?? 0) >= 5 },
  { label: 'Review Guardian', test: (row) => Number(row.reviews ?? 0) >= 5 },
  { label: 'Commit Streak', test: (row) => Number(row.commits ?? 0) >= 20 },
  { label: 'Quest Finisher', test: (row) => Number(row.requestBonusXp ?? 0) > 0 },
];

function buildBadges(row) {
  const knownLabels = new Set(BADGE_RULES.map((rule) => rule.label));
  const existing = Array.isArray(row.badges) ? row.badges.filter((badge) => knownLabels.has(badge)) : [];
  if (existing.length) return existing;
  return BADGE_RULES.filter((rule) => rule.test(row)).map((rule) => rule.label);
}

function mapFirebaseRecordToPlayer(row) {
  const username = String(row.username ?? '').trim() || 'unknown';
  const displayName = typeof row.displayName === 'string' && row.displayName.trim() ? row.displayName.trim() : username;
  const parts = displayName.split(/\s+/).filter(Boolean);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : displayName.slice(0, 2).toUpperCase();

  return {
    id: row.id || `${username}__${row.repoKey ?? ''}`,
    name: displayName,
    username,
    initials,
    xp: Number(row.xp ?? 0),
    level: Number(row.level ?? 1),
    commits: Number(row.commits ?? 0),
    mergedPRs: Number(row.mergedPRs ?? 0),
    openPRs: Number(row.openPRs ?? 0),
    reviews: Number(row.reviews ?? 0),
    weeklyXp: Number(row.weeklyXp ?? 0),
    weeklyCommits: Number(row.weeklyCommits ?? 0),
    weeklyMergedPRs: Number(row.weeklyMergedPRs ?? 0),
    weeklyOpenPRs: Number(row.weeklyOpenPRs ?? 0),
    weeklyReviews: Number(row.weeklyReviews ?? 0),
    weeklyRangeStart: String(row.weeklyRangeStart ?? ''),
    weeklyRangeEnd: String(row.weeklyRangeEnd ?? ''),
    weeklySyncedAtMs: Number(row.weeklySyncedAtMs ?? 0),
    allTimeSyncedAtMs: Number(row.allTimeSyncedAtMs ?? 0),
    updatedAtMs: Number(row.updatedAtMs ?? 0),
    createdAtMs: Number(row.createdAtMs ?? 0),
    requestBonusXp: Number(row.requestBonusXp ?? 0),
    questBonusXp: Number(row.requestBonusXp ?? 0),
    streak: Number(row.streak ?? 0),
    badges: buildBadges(row),
  };
}

export class LeaderboardController {
  constructor(store) {
    this.store = store;
  }

  applyCurrentUserRow(players) {
    const username = String(this.store.profile.username || '').trim();
    if (!username) return;
    const current = players.find((player) => player.username === username);
    if (!current) return;

    this.store.setHeroActivity({
      commits: current.commits,
      mergedPRs: current.mergedPRs,
      openPRs: current.openPRs,
      reviews: current.reviews,
      questBonusXp: current.questBonusXp || current.requestBonusXp || 0,
    });

    if (current.allTimeSyncedAtMs) {
      this.store.setLastSyncedAt(new Date(current.allTimeSyncedAtMs).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }));
    }
  }

  startForActiveRepository() {
    this.store.stopLeaderboardSubscription();
    if (!isFirebaseConfigured() || !this.store.repoKeyString) return;

    try {
      const unsubscribe = subscribeLeaderboard({
        repoKey: this.store.repoKeyString,
        maxRows: 50,
        onUpdate: (records) => {
          const players = records.map(mapFirebaseRecordToPlayer);
          this.store.setLeaderboardRows(players);
          this.applyCurrentUserRow(players);
        },
        onError: (error) => {
          this.store.addNotification(
            `Leaderboard sync failed: ${error?.message ?? 'unknown'}`,
            'Leaderboard error',
            'error',
          );
        },
      });
      this.store.setLeaderboardUnsubscribe(unsubscribe);
    } catch (error) {
      this.store.addNotification(
        `Team ranking could not start: ${error?.message ?? 'try again later'}`,
        'Team ranking error',
        'error',
      );
    }
  }
}
