import { calculateXp, DEFAULT_SCORE_RULES } from './scoreRules.js';

export class HeroModel {
  constructor({
    commits = 0,
    mergedPRs = 0,
    openPRs = 0,
    reviews = 0,
    questBonusXp = 0,
    scoreRules = DEFAULT_SCORE_RULES,
  } = {}) {
    this.commits = Number(commits ?? 0);
    this.mergedPRs = Number(mergedPRs ?? 0);
    this.openPRs = Number(openPRs ?? 0);
    this.reviews = Number(reviews ?? 0);
    this.questBonusXp = Number(questBonusXp ?? 0);
    this.scoreRules = scoreRules;
  }

  static fromActivity(activity = {}, scoreRules = DEFAULT_SCORE_RULES) {
    return new HeroModel({
      commits: Number(activity.commits ?? 0),
      mergedPRs: Number(activity.mergedPRs ?? 0),
      openPRs: Number(activity.openPRs ?? 0),
      reviews: Number(activity.reviews ?? 0),
      questBonusXp: Number(activity.questBonusXp ?? 0),
      scoreRules,
    });
  }

  get xp() {
    return calculateXp(this, this.scoreRules);
  }

  get level() {
    return Math.floor(this.xp / 100) + 1;
  }
}
