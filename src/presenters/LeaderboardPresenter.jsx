import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useControllers, useStore } from '../stores/StoreProvider.jsx';
import LeaderboardView from '../views/LeaderboardView.jsx';

function formatRangeDate(date) {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function getLastSevenDaysRange(now = new Date()) {
  const end = new Date(now);
  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  return {
    since: start.toISOString().slice(0, 10),
    until: end.toISOString().slice(0, 10),
    label: `${formatRangeDate(start)} – ${formatRangeDate(end)}`,
  };
}

function getAllTimeLabel(rows, now = new Date()) {
  const timestamps = rows
    .map((row) => Number(row.allTimeSyncedAtMs || row.updatedAtMs || 0))
    .filter(Boolean);

  if (timestamps.length === 0) {
    return `All synced data through ${formatRangeDate(now)}`;
  }

  const start = new Date(Math.min(...timestamps));
  return `${formatRangeDate(start)} – ${formatRangeDate(now)}`;
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

  const timeRangeLabel = filter === 'All time' ? getAllTimeLabel(rankedRows) : getLastSevenDaysRange().label;

  const visibleRows = useMemo(() => {
    const rowsWithDisplayXp = rankedRows.map((row) => ({
      ...row,
      rankXp: filter === 'All time' ? Number(row.xp ?? 0) : getFreshWeeklyXp(row),
    }));
    const q = store.leaderboardStore.searchQuery?.trim?.().toLowerCase?.() || '';
    if (!q) return rowsWithDisplayXp;
    return rowsWithDisplayXp.filter((row) => {
      const haystack = [row.name, row.username, ...(row.badges ?? [])].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [rankedRows, store.leaderboardStore.searchQuery, filter]);

  function handleFilterChange(nextFilter) {
    store.setLeaderboardFilter(nextFilter);

    if (nextFilter === 'Last 7 days') {
      void repository.syncWeeklyLeaderboardForActiveRepository({ source: 'background' });
    } else {
      void repository.syncAllTimeLeaderboard({ source: 'background' });
    }
  }

  function handleSearchQueryChange(value) {
    store.leaderboardStore.setSearchQuery(value);
  }

  return (
    <LeaderboardView
      repo={store.repo}
      rows={visibleRows}
      filter={filter}
      onFilterChange={handleFilterChange}
      timeRangeLabel={timeRangeLabel}
      searchQuery={store.leaderboardStore.searchQuery}
      onSearchQueryChange={handleSearchQueryChange}
      onSelectPlayer={store.selectPlayer}
      scoreRules={store.scoreRules}
    />
  );
});

export default LeaderboardPresenter;
