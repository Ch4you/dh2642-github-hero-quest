import { isFirebaseConfigured, subscribeLeaderboard } from '../services/firebaseService.js';

function timestampToMs(value) {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.toDate === 'function') return value.toDate().getTime();
  if (typeof value === 'number') return value;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
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
    updatedAtMs: timestampToMs(row.updatedAt),
    createdAtMs: Number(row.createdAtMs ?? 0) || timestampToMs(row.createdAt) || timestampToMs(row.updatedAt),
    requestBonusXp: Number(row.requestBonusXp ?? 0),
    questBonusXp: Number(row.requestBonusXp ?? 0),
    trend: row.trend ?? '',
    streak: Number(row.streak ?? 0),
    badges: Array.isArray(row.badges) && row.badges.length ? row.badges : ['Contributor'],
  };
}

export class LeaderboardController {
  constructor(store) {
    this.store = store;
  }

  startForActiveRepository() {
    this.store.stopLeaderboardSubscription();
    if (!isFirebaseConfigured() || !this.store.repoKeyString) return;

    try {
      const unsubscribe = subscribeLeaderboard({
        repoKey: this.store.repoKeyString,
        maxRows: 50,
        onUpdate: (records) => this.store.setLeaderboardRows(records.map(mapFirebaseRecordToPlayer)),
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
