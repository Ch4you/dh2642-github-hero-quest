export class QuestModel {
  constructor({
    title = 'Reach merged PR goal',
    targetMergedPRs = 12,
    deadline = '',
  } = {}) {
    this.title = title;
    this.targetMergedPRs = Number(targetMergedPRs || 12);
    this.deadline = deadline;
  }

  progress(mergedPRs) {
    const goal = Math.max(1, Number(this.targetMergedPRs || 1));
    const merged = Number(mergedPRs || 0);
    const percentage = Math.min(100, Math.round((merged / goal) * 100));
    return { goal, merged, percentage };
  }
}

