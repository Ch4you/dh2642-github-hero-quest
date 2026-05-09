import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useControllers, useStore } from '../stores/StoreProvider.jsx';
import ConnectRepoView from '../views/ConnectRepoView.jsx';

const ConnectRepoPresenter = observer(function ConnectRepoPresenter() {
  const store = useStore();
  const { repository } = useControllers();
  const [scoreRuleDraft, setScoreRuleDraft] = useState(store.scoreRules);
  const [scoreRulesRepoKey, setScoreRulesRepoKey] = useState(store.activeRepoKey);

  useEffect(() => {
    void repository.loadRecentRepositories();
  }, [repository, store.profile.username]);

  useEffect(() => {
    if (!scoreRulesRepoKey || scoreRulesRepoKey === store.activeRepoKey) {
      setScoreRuleDraft(store.scoreRules);
      setScoreRulesRepoKey(store.activeRepoKey);
    }
  }, [store.scoreRules, store.activeRepoKey, scoreRulesRepoKey]);

  async function handleScoreRulesRepoChange(repoKey) {
    setScoreRulesRepoKey(repoKey);
    const rules = await repository.loadScoreRulesForRepo(repoKey);
    setScoreRuleDraft(rules);
  }

  function updateScoreRule(key, value) {
    setScoreRuleDraft((draft) => ({ ...draft, [key]: value }));
  }

  return (
    <ConnectRepoView
      repositoryInput={store.repositoryInput}
      onRepositoryInputChange={store.setRepositoryInput}
      onConnect={() => repository.connectRepositoryFromInput()}
      onUseSample={() => repository.connectSampleRepository()}
      onOpenRecent={(repoName) => repository.connectRecentRepository(repoName)}
      recentRepositories={store.recentRepositories}
      recentLoading={store.recentLoading}
      connectError={store.connectError}
      repo={store.repo}
      repositories={store.repositories}
      activeRepoKey={store.activeRepoKey}
      scoreRulesRepoKey={scoreRulesRepoKey}
      onScoreRulesRepoChange={handleScoreRulesRepoChange}
      scoreRules={scoreRuleDraft}
      onScoreRuleChange={updateScoreRule}
      onSaveScoreRules={() => repository.saveScoreRules(scoreRuleDraft, scoreRulesRepoKey)}
    />
  );
});

export default ConnectRepoPresenter;
