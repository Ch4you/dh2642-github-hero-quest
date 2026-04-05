import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../models/StoreProvider.jsx';
import ShellPresenter from './ShellPresenter.jsx';
import LeaderboardView from '../views/LeaderboardView.jsx';
import { players } from '../models/mockData.js';

const LeaderboardPresenter = observer(function LeaderboardPresenter() {
  const store = useStore();
  const [filter, setFilter] = useState('This week');

  return (
    <ShellPresenter current="leaderboard">
      <LeaderboardView
        repo={store.repo}
        rows={store.leaderboard.length ? store.leaderboard : players}
        filter={filter}
        onFilterChange={setFilter}
        onSelectPlayer={store.selectPlayer}
      />
    </ShellPresenter>
  );
});

export default LeaderboardPresenter;

