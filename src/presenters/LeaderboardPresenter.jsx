import { useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../models/StoreProvider.jsx';
import ShellPresenter from './ShellPresenter.jsx';
import LeaderboardView from '../views/LeaderboardView.jsx';
import { players } from '../models/mockData.js';

const LeaderboardPresenter = observer(function LeaderboardPresenter() {
  const store = useStore();
  const [filter, setFilter] = useState('This week');
  const [searchQuery, setSearchQuery] = useState('');

  const sourceRows = store.leaderboard.length ? store.leaderboard : players;
  const rankedRows = useMemo(() => {
    const rows = [...sourceRows];
    if (filter === 'All time') {
      return rows.sort((a, b) => Number(b.xp ?? 0) - Number(a.xp ?? 0));
    }
    return rows.sort((a, b) => {
      const ta = Number(String(a.trend ?? '0').replace('+', '')) || 0;
      const tb = Number(String(b.trend ?? '0').replace('+', '')) || 0;
      return tb - ta;
    });
  }, [sourceRows, filter]);

  const visibleRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rankedRows;
    return rankedRows.filter((row) => row.name?.toLowerCase().includes(q));
  }, [rankedRows, searchQuery]);

  return (
    <ShellPresenter current="leaderboard">
      <LeaderboardView
        repo={store.repo}
        rows={visibleRows}
        filter={filter}
        onFilterChange={setFilter}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSelectPlayer={store.selectPlayer}
      />
    </ShellPresenter>
  );
});

export default LeaderboardPresenter;

