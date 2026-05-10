import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  GithubAuthProvider,
  getAuth,
  getAdditionalUserInfo,
  onAuthStateChanged,
  signOut,
  signInWithPopup,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import {
  fromAuthProfileDoc,
  fromMergedPullRequestDetailsDoc,
  fromRequestMetricsDoc,
  fromRequestsDoc,
  fromScoreRulesDoc,
  fromUserDoc,
  fromUserProgressDoc,
  fromWorkspaceDoc,
  getWorkspaceDocId,
  normalizeRepoKey,
  toAuthProfileDoc,
  toMergedPullRequestDetailsDoc,
  toRequestMetricsDoc,
  toRequestsDoc,
  toScoreRulesDoc,
  toUserDoc,
  toUserProgressDoc,
  toWorkspaceDoc,
} from '../models/fireModels';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
};

const REQUIRED_FIREBASE_FIELDS = ['apiKey', 'authDomain', 'projectId', 'appId'];
const USERS_COLLECTION = 'heroquest-users';
const USER_PROGRESS_COLLECTION = 'heroquest-user-progress';
const LEADERBOARD_COLLECTION = 'heroquest-leaderboard';
const AUTH_PROFILE_COLLECTION = 'heroquest-auth-profile';
const REQUESTS_COLLECTION = 'heroquest-requests';
const SCORE_RULES_COLLECTION = 'heroquest-score-rules';
const WORKSPACES_COLLECTION = 'heroquest-workspaces';
const REQUEST_METRICS_COLLECTION = 'heroquest-request-metrics';
const MERGED_PR_DETAILS_COLLECTION = 'heroquest-merged-pr-details';

let dbInstance = null;
let authInstance = null;

export function isFirebaseConfigured() {
  return REQUIRED_FIREBASE_FIELDS.every((field) => Boolean(firebaseConfig[field]));
}

function getFirebaseApp() {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase config is missing. Add VITE_FIREBASE_* env vars before using Firebase services.');
  }
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

function getDb() {
  if (dbInstance) return dbInstance;
  dbInstance = getFirestore(getFirebaseApp());
  return dbInstance;
}

function getAuthInstance() {
  if (authInstance) return authInstance;
  authInstance = getAuth(getFirebaseApp());
  return authInstance;
}

export async function saveUserData(data) {
  const userDoc = toUserDoc(data);
  const db = getDb();
  await setDoc(doc(db, USERS_COLLECTION, userDoc.username), { ...userDoc, updatedAt: serverTimestamp() }, { merge: true });
}

export async function getUserData(username) {
  if (!username) throw new Error('getUserData: username is required');
  const db = getDb();
  const snap = await getDoc(doc(db, USERS_COLLECTION, username));
  return snap.exists() ? fromUserDoc(snap.data()) : null;
}

export async function saveUserProgress(progress) {
  if (!progress?.username) throw new Error('saveUserProgress: progress.username is required');
  const db = getDb();
  const repoKey = normalizeRepoKey(progress.repoKey);
  const progressDocId = `${progress.username}__${repoKey}`;
  const progressDocRef = doc(db, USER_PROGRESS_COLLECTION, progressDocId);
  const leaderboardDocRef = doc(db, LEADERBOARD_COLLECTION, progressDocId);
  const existingProgress = await getDoc(progressDocRef);
  const existingLeaderboard = await getDoc(leaderboardDocRef);
  const hasExisting = existingProgress.exists() || existingLeaderboard.exists();
  const payload = {
    ...toUserProgressDoc(progress, { hasExisting }),
    updatedAt: serverTimestamp(),
  };

  if (!hasExisting) payload.createdAt = serverTimestamp();

  await setDoc(progressDocRef, payload, { merge: true });
  await setDoc(leaderboardDocRef, payload, { merge: true });
}

export function subscribeLeaderboard({ repoKey = 'default', maxRows = 20, onUpdate, onError } = {}) {
  if (typeof onUpdate !== 'function') {
    throw new Error('subscribeLeaderboard: onUpdate callback is required');
  }

  const db = getDb();
  const cleanRepoKey = normalizeRepoKey(repoKey);
  const rows = Math.min(100, Math.max(1, Number(maxRows) || 20));
  const leaderboardQuery = query(collection(db, LEADERBOARD_COLLECTION), where('repoKey', '==', cleanRepoKey));

  return onSnapshot(
    leaderboardQuery,
    (snapshot) => {
      const records = snapshot.docs
        .map((item) => fromUserProgressDoc({ id: item.id, ...item.data() }))
        .sort((a, b) => Number(b.xp ?? 0) - Number(a.xp ?? 0))
        .slice(0, rows);
      onUpdate(records);
    },
    (error) => {
      if (typeof onError === 'function') onError(error);
    },
  );
}

export async function saveAuthProfile(profile) {
  if (!profile?.uid || !profile?.username?.trim()) return;
  const db = getDb();
  await setDoc(
    doc(db, AUTH_PROFILE_COLLECTION, profile.uid),
    {
      ...toAuthProfileDoc(profile),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function subscribeAuthState(onChange) {
  if (!isFirebaseConfigured()) return () => {};
  const auth = getAuthInstance();
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      onChange(null);
      return;
    }
    const fallback = { uid: user.uid, username: '', displayName: '', avatarUrl: user.photoURL || '' };
    try {
      const db = getDb();
      const snap = await getDoc(doc(db, AUTH_PROFILE_COLLECTION, user.uid));
      onChange(snap.exists() ? fromAuthProfileDoc(snap.data(), fallback) : fallback);
    } catch {
      onChange(fallback);
    }
  });
}

export async function signInWithGitHubPopup() {
  const auth = getAuthInstance();
  const provider = new GithubAuthProvider();
  provider.addScope('read:user');
  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  const info = getAdditionalUserInfo(result);
  const profile = info?.profile ?? {};
  const username =
    (typeof profile.login === 'string' && profile.login.trim()) ||
    (typeof user.reloadUserInfo?.screenName === 'string' && user.reloadUserInfo.screenName.trim()) ||
    '';

  return {
    uid: user.uid,
    username,
    displayName: user.displayName || profile.name || username || '',
    avatarUrl: user.photoURL || profile.avatar_url || '',
    email: user.email || '',
  };
}

export async function signOutCurrentUser() {
  if (!isFirebaseConfigured()) return;
  await signOut(getAuthInstance());
}

export async function saveRequestsForRepo({ repoKey, requests, updatedBy }) {
  if (!repoKey) throw new Error('saveRequestsForRepo: repoKey is required');
  const db = getDb();
  const cleanRepoKey = normalizeRepoKey(repoKey);
  await setDoc(
    doc(db, REQUESTS_COLLECTION, cleanRepoKey),
    {
      ...toRequestsDoc({ repoKey, requests, updatedBy }),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function subscribeRequestsForRepo({ repoKey, onUpdate, onError }) {
  if (!repoKey || typeof onUpdate !== 'function') return () => {};
  const db = getDb();
  const cleanRepoKey = normalizeRepoKey(repoKey);
  return onSnapshot(
    doc(db, REQUESTS_COLLECTION, cleanRepoKey),
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(fromRequestsDoc(snapshot.data()));
        return;
      }
      onUpdate([]);
    },
    (error) => {
      if (typeof onError === 'function') onError(error);
    },
  );
}

export async function saveScoreRulesForRepo({ repoKey, scoreRules }) {
  if (!repoKey) throw new Error('saveScoreRulesForRepo: repoKey is required');
  const db = getDb();
  await setDoc(
    doc(db, SCORE_RULES_COLLECTION, normalizeRepoKey(repoKey)),
    { ...toScoreRulesDoc(scoreRules), updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function getScoreRulesForRepo(repoKey) {
  if (!repoKey) return null;
  const db = getDb();
  const snap = await getDoc(doc(db, SCORE_RULES_COLLECTION, normalizeRepoKey(repoKey)));
  return snap.exists() ? fromScoreRulesDoc(snap.data()) : null;
}

export async function saveRequestMetricsForRepo({ repoKey, username, valuesById, contributionsById, syncedAtMs }) {
  if (!repoKey) throw new Error('saveRequestMetricsForRepo: repoKey is required');
  const db = getDb();
  const cleanRepoKey = normalizeRepoKey(repoKey);
  const metricsDocRef = doc(db, REQUEST_METRICS_COLLECTION, cleanRepoKey);
  const snap = await getDoc(metricsDocRef);
  const previous = snap.exists() ? snap.data() : {};

  await setDoc(
    metricsDocRef,
    {
      ...toRequestMetricsDoc({
        repoKey,
        username,
        valuesById,
        contributionsById,
        previousUsers: previous.userContributionsById || {},
        syncedAtMs,
      }),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function getRequestMetricsForRepo({ repoKey, username }) {
  if (!repoKey) return null;
  const db = getDb();
  const cleanRepoKey = normalizeRepoKey(repoKey);
  const snap = await getDoc(doc(db, REQUEST_METRICS_COLLECTION, cleanRepoKey));
  if (!snap.exists()) return null;
  return fromRequestMetricsDoc(snap.data(), username);
}

export async function saveMergedPullRequestDetailsForRepo({ repoKey, items, syncedAtMs }) {
  if (!repoKey) throw new Error('saveMergedPullRequestDetailsForRepo: repoKey is required');
  const db = getDb();
  const cleanRepoKey = normalizeRepoKey(repoKey);
  await setDoc(
    doc(db, MERGED_PR_DETAILS_COLLECTION, cleanRepoKey),
    {
      ...toMergedPullRequestDetailsDoc({ repoKey, items, syncedAtMs }),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function getMergedPullRequestDetailsForRepo(repoKey) {
  if (!repoKey) return null;
  const db = getDb();
  const snap = await getDoc(doc(db, MERGED_PR_DETAILS_COLLECTION, normalizeRepoKey(repoKey)));
  if (!snap.exists()) return null;
  return fromMergedPullRequestDetailsDoc(snap.data());
}

export async function saveWorkspace({ uid, username, repositories, activeRepoKey }) {
  const db = getDb();
  const docId = getWorkspaceDocId({ uid, username });
  await setDoc(
    doc(db, WORKSPACES_COLLECTION, docId),
    {
      ...toWorkspaceDoc({ uid, username, repositories, activeRepoKey }),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function getWorkspace({ uid, username }) {
  const db = getDb();
  const docId = getWorkspaceDocId({ uid, username });
  const snap = await getDoc(doc(db, WORKSPACES_COLLECTION, docId));

  if (!snap.exists()) {
    return { repositories: [], activeRepoKey: '' };
  }

  return fromWorkspaceDoc(snap.data());
}
