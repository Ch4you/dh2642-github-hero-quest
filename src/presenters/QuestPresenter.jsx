import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../models/StoreProvider.jsx';
import QuestConfiguratorView from '../views/QuestConfiguratorView.jsx';

const QuestPresenter = observer(function QuestPresenter() {
  const store = useStore();
  const seed = store.questDraft ?? store.quest;
  const [title, setTitle] = useState(seed.title);
  const [description, setDescription] = useState(seed.description ?? store.quest.description);
  const [target, setTarget] = useState(String(seed.targetMergedPRs ?? 12));
  const [deadline, setDeadline] = useState(seed.deadline ?? '');

  function buildPayload() {
    const parsedTarget = Number(target);
    return {
      title,
      description,
      targetMergedPRs: Number.isFinite(parsedTarget) ? parsedTarget : store.quest.targetMergedPRs,
      deadline,
    };
  }

  return (
    <QuestConfiguratorView
      title={title}
      description={description}
      target={target}
      deadline={deadline}
      hero={store.hero}
      onTitleChange={setTitle}
      onDescriptionChange={setDescription}
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
  );
});

export default QuestPresenter;

