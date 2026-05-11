import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useControllers, useStore } from '../stores/StoreProvider.jsx';
import LeaderboardView from '../views/LeaderboardView.jsx';

function formatRangeDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function getLastSevenDaysRange(now = new Date()) {
  const end = new Date(now);
  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  return {
    since: isoDate(start),
    until: isoDate(end),
    label: `${formatRangeDate(start)} – ${formatRangeDate(end)}`,
  };
}

function getAllTimeRangeLabel(repoCreatedAt, rows = [], now = new Date()) {
  const repoCreatedAtMs = Date.parse(repoCreatedAt || '');
  if (Number.isFinite(repoCreatedAtMs) && repoCreatedAtMs <= now.getTime()) {
    return `${formatRangeDate(new Date(repoCreatedAtMs))} – ${formatRangeDate(now)}`;
  }

  const timestamps = rows
    .map((row) => Number(row.createdAtMs || row.allTimeSyncedAtMs || row.updatedAtMs || 0))
    .filter(Boolean);

  if (timestamps.length) {
    return `${formatRangeDate(new Date(Math.min(...timestamps)))} – ${formatRangeDate(now)}`;
  }

  return 'All time';
}

function getFreshWeeklyXp(row) {
  const range = getLastSevenDaysRange();

  if (row?.weeklyRangeStart === range.since && row?.weeklyRangeEnd === range.until) {
    return Number(row.weeklyXp ?? 0);
  }

  return 0;
}

const LeaderboardPresenter = observer(function LeaderboardPresenter() {
  const store = useStore();
  const { repository } = useControllers();
  const filter = store.leaderboardFilter;

  const rankedRows = useMemo(() => {
    const rows = [...store.leaderboard];
    if (filter === 'All time') {
      return rows.sort((a, b) => Number(b.xp ?? 0) - Number(a.xp ?? 0));
    }
    return rows.sort((a, b) => getFreshWeeklyXp(b) - getFreshWeeklyXp(a));
  }, [store.leaderboard, filter]);

  const visibleRows = useMemo(() => {
    const rowsWithDisplayXp = rankedRows.map((row) => ({
      ...row,
      rankXp: filter === 'All time' ? Number(row.xp ?? 0) : getFreshWeeklyXp(row),
    }));
    const query = store.leaderboardSearchQuery?.trim().toLowerCase() || '';
    if (!query) return rowsWithDisplayXp;
    return rowsWithDisplayXp.filter((row) => {
      const haystack = [row.name, row.username, ...(row.badges ?? [])].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }, [rankedRows, store.leaderboardSearchQuery, filter]);

  const timeRangeLabel = filter === 'All time'
    ? getAllTimeRangeLabel(store.repo?.createdAt, visibleRows)
    : getLastSevenDaysRange().label;

  function handleFilterChange(nextFilter) {
    store.setLeaderboardFilter(nextFilter);

    if (nextFilter === 'Last 7 days') {
      void repository.syncWeeklyLeaderboardForActiveRepository({ source: 'background', onlyIfMissing: true });
    } else {
      void repository.syncAllTimeLeaderboard({ source: 'background', onlyIfMissing: true });
    }
  }

  function handleSearchQueryChange(value) {
    store.setLeaderboardSearchQuery(value);
  }

  return (
    <LeaderboardView
      rows={visibleRows}
      filter={filter}
      onFilterChange={handleFilterChange}
      timeRangeLabel={timeRangeLabel}
      searchQuery={store.leaderboardSearchQuery}
      onSearchQueryChange={handleSearchQueryChange}
      onSelectPlayer={store.selectPlayer}
      scoreRules={store.scoreRules}
    />
  );
});

export default LeaderboardPresenter;
