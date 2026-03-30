export function xpFromActivity({ mergedPRs, openPRs, commits }) {
  const m = Number(mergedPRs ?? 0);
  const o = Number(openPRs ?? 0);
  const c = Number(commits ?? 0);

  const xp = Math.max(0, m * 20 + o * 2 + c * 1);
  const level = Math.floor(xp / 100) + 1;
  return { xp, level };
}

