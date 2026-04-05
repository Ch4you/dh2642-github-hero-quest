import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../models/StoreProvider.jsx';
import ShellPresenter from './ShellPresenter.jsx';
import QuestConfiguratorView from '../views/QuestConfiguratorView.jsx';

const QuestPresenter = observer(function QuestPresenter() {
  const store = useStore();
  const [title, setTitle] = useState(store.quest.title);
  const [target, setTarget] = useState(String(store.quest.targetMergedPRs ?? 12));
  const [deadline, setDeadline] = useState(store.quest.deadline ?? '');

  return (
    <ShellPresenter current="quests">
      <QuestConfiguratorView
        title={title}
        target={target}
        deadline={deadline}
        hero={store.hero}
        onTitleChange={setTitle}
        onTargetChange={setTarget}
        onDeadlineChange={setDeadline}
        targetMergedPRsBase={store.quest.targetMergedPRs}
        onSaveQuest={(payload) => {
          store.updateQuest(payload);
          store.setStep('dashboard');
        }}
        onBackDashboard={() => store.setStep('dashboard')}
      />
    </ShellPresenter>
  );
});

export default QuestPresenter;

