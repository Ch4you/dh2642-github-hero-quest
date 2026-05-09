export const DEFAULT_SCORE_RULES = Object.freeze({
  commit: 5,
  mergedPR: 20,
  review: 10,
  openPR: 2,
  questCompletion: 50,
});

export function normalizeScoreRules(rules = {}) {
  return {
    commit: Number.isFinite(Number(rules.commit)) ? Number(rules.commit) : DEFAULT_SCORE_RULES.commit,
    mergedPR: Number.isFinite(Number(rules.mergedPR)) ? Number(rules.mergedPR) : DEFAULT_SCORE_RULES.mergedPR,
    review: Number.isFinite(Number(rules.review)) ? Number(rules.review) : DEFAULT_SCORE_RULES.review,
    openPR: Number.isFinite(Number(rules.openPR)) ? Number(rules.openPR) : DEFAULT_SCORE_RULES.openPR,
    questCompletion: Number.isFinite(Number(rules.questCompletion))
      ? Number(rules.questCompletion)
      : DEFAULT_SCORE_RULES.questCompletion,
  };
}

export function calculateXp(activity = {}, rules = DEFAULT_SCORE_RULES) {
  const cleanRules = normalizeScoreRules(rules);
  return (
    Number(activity.commits ?? 0) * cleanRules.commit +
    Number(activity.mergedPRs ?? 0) * cleanRules.mergedPR +
    Number(activity.reviews ?? 0) * cleanRules.review +
    Number(activity.openPRs ?? 0) * cleanRules.openPR +
    Number(activity.questBonusXp ?? 0)
  );
}

export function getXpBreakdown(activity = {}, rules = DEFAULT_SCORE_RULES) {
  const cleanRules = normalizeScoreRules(rules);
  return [
    {
      key: 'commits',
      label: 'Commits',
      count: Number(activity.commits ?? 0),
      xp: Number(activity.commits ?? 0) * cleanRules.commit,
      rule: cleanRules.commit,
    },
    {
      key: 'mergedPRs',
      label: 'Merged PRs',
      count: Number(activity.mergedPRs ?? 0),
      xp: Number(activity.mergedPRs ?? 0) * cleanRules.mergedPR,
      rule: cleanRules.mergedPR,
    },
    {
      key: 'reviews',
      label: 'Reviews',
      count: Number(activity.reviews ?? 0),
      xp: Number(activity.reviews ?? 0) * cleanRules.review,
      rule: cleanRules.review,
    },
    {
      key: 'openPRs',
      label: 'Open PRs',
      count: Number(activity.openPRs ?? 0),
      xp: Number(activity.openPRs ?? 0) * cleanRules.openPR,
      rule: cleanRules.openPR,
    },
    {
      key: 'requestBonus',
      label: 'Completed request bonus',
      count: Number(activity.questBonusXp ?? 0),
      xp: Number(activity.questBonusXp ?? 0),
      rule: 1,
    },
  ];
}
