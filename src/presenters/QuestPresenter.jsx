import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../models/StoreProvider.jsx';
import ShellPresenter from './ShellPresenter.jsx';
import QuestConfiguratorView from '../views/QuestConfiguratorView.jsx';

const QuestPresenter = observer(function QuestPresenter() {
  const store = useStore();
  const seed = store.questDraft ?? store.quest;
  const [title, setTitle] = useState(seed.title);
  const [target, setTarget] = useState(String(seed.targetMergedPRs ?? 12));
  const [deadline, setDeadline] = useState(seed.deadline ?? '');

  function buildPayload() {
    const parsedTarget = Number(target);
    return {
      title,
      targetMergedPRs: Number.isFinite(parsedTarget) ? parsedTarget : store.quest.targetMergedPRs,
      deadline,
    };
  }

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
        onSaveQuest={() => {
          store.updateQuest(buildPayload());
          store.setStep('dashboard');
        }}
        onSaveDraft={() => {
          store.saveQuestDraft(buildPayload());
          store.setStep('dashboard');
        }}
        onBackDashboard={() => store.setStep('dashboard')}
      />
    </ShellPresenter>
  );
});

export default QuestPresenter;

