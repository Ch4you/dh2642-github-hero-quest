import { useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../stores/StoreProvider.jsx';
import LeaderboardView from '../views/LeaderboardView.jsx';

function formatRangeDate(date) {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function getLastSevenDaysLabel(now = new Date()) {
  const end = new Date(now);
  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  return `${formatRangeDate(start)} – ${formatRangeDate(end)}`;
}

function getAllTimeLabel(rows, now = new Date()) {
  const timestamps = rows.map((row) => Number(row.updatedAtMs ?? 0)).filter(Boolean);
  if (timestamps.length === 0) {
    return `All synced data through ${formatRangeDate(now)}`;
  }
  const start = new Date(Math.min(...timestamps));
  return `${formatRangeDate(start)} – ${formatRangeDate(now)}`;
}

const LeaderboardPresenter = observer(function LeaderboardPresenter() {
  const store = useStore();
  const [filter, setFilter] = useState('Last 7 days');
  const [searchQuery, setSearchQuery] = useState('');

  const rankedRows = useMemo(() => {
    const rows = [...store.leaderboard];
    if (filter === 'All time') {
      return rows.sort((a, b) => Number(b.xp ?? 0) - Number(a.xp ?? 0));
    }
    return rows.sort((a, b) => Number(b.weeklyXp ?? b.xp ?? 0) - Number(a.weeklyXp ?? a.xp ?? 0));
  }, [store.leaderboard, filter]);

  const timeRangeLabel = filter === 'All time' ? getAllTimeLabel(rankedRows) : getLastSevenDaysLabel();

  const visibleRows = useMemo(() => {
    const rowsWithDisplayXp = rankedRows.map((row) => ({
      ...row,
      rankXp: filter === 'All time' ? Number(row.xp ?? 0) : Number(row.weeklyXp ?? row.xp ?? 0),
    }));
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rowsWithDisplayXp;
    return rowsWithDisplayXp.filter((row) => {
      const haystack = [row.name, row.username, ...(row.badges ?? [])].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [rankedRows, searchQuery, filter]);

  return (
    <LeaderboardView
      repo={store.repo}
      rows={visibleRows}
      filter={filter}
      onFilterChange={setFilter}
      timeRangeLabel={timeRangeLabel}
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      onSelectPlayer={store.selectPlayer}
      scoreRules={store.scoreRules}
    />
  );
});

export default LeaderboardPresenter;
