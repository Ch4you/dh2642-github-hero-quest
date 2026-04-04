export class HeroModel {
  constructor({
    commits = 0,
    mergedPRs = 0,
    openPRs = 0,
    reviews = 0,
  } = {}) {
    this.commits = commits;
    this.mergedPRs = mergedPRs;
    this.openPRs = openPRs;
    this.reviews = reviews;
  }

  static fromActivity(activity = {}) {
    return new HeroModel({
      commits: Number(activity.commits ?? 0),
      mergedPRs: Number(activity.mergedPRs ?? 0),
      openPRs: Number(activity.openPRs ?? 0),
      reviews: Number(activity.reviews ?? 0),
    });
  }

  get xp() {
    return this.commits * 5 + this.mergedPRs * 20 + this.reviews * 10 + this.openPRs * 2;
  }

  get level() {
    return Math.floor(this.xp / 100) + 1;
  }
}

