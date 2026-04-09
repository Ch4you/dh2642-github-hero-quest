import { useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../models/StoreProvider.jsx';
import LeaderboardView from '../views/LeaderboardView.jsx';

const LeaderboardPresenter = observer(function LeaderboardPresenter() {
  const store = useStore();
  const [filter, setFilter] = useState('This week');
  const [searchQuery, setSearchQuery] = useState('');

  function getWeeklyScore(row) {
    const weeklyXp = Number(row.weeklyXp);
    if (Number.isFinite(weeklyXp)) return weeklyXp;

    const commits = Number(row.commits ?? 0);
    const merged = Number(row.mergedPRs ?? 0);
    const reviews = Number(row.reviews ?? 0);
    return commits * 5 + merged * 20 + reviews * 10;
  }

  const sourceRows = store.leaderboard;
  const rankedRows = useMemo(() => {
    const rows = [...sourceRows];
    if (filter === 'All time') {
      return rows.sort((a, b) => Number(b.xp ?? 0) - Number(a.xp ?? 0));
    }
    return rows.sort((a, b) => getWeeklyScore(b) - getWeeklyScore(a));
  }, [sourceRows, filter]);

  const visibleRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rankedRows;
    return rankedRows.filter((row) => row.name?.toLowerCase().includes(q));
  }, [rankedRows, searchQuery]);

  return (
    <LeaderboardView
      repo={store.repo}
      rows={visibleRows}
      filter={filter}
      onFilterChange={setFilter}
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      onSelectPlayer={store.selectPlayer}
    />
  );
});

export default LeaderboardPresenter;
