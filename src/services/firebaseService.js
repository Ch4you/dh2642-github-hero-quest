import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  GithubAuthProvider,
  getAuth,
  getAdditionalUserInfo,
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

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
};

const REQUIRED_FIREBASE_FIELDS = ['apiKey', 'authDomain', 'projectId', 'appId'];

export function isFirebaseConfigured() {
  return REQUIRED_FIREBASE_FIELDS.every((field) => Boolean(firebaseConfig[field]));
}

let dbInstance = null;
let authInstance = null;

function getDb() {
  if (dbInstance) return dbInstance;

  if (!isFirebaseConfigured()) {
    throw new Error('Firebase config is missing. Add VITE_FIREBASE_* env vars before using Firebase services.');
  }

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  dbInstance = getFirestore(app);
  return dbInstance;
}

function getFirebaseApp() {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase config is missing. Add VITE_FIREBASE_* env vars before using Firebase services.');
  }
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

function getAuthInstance() {
  if (authInstance) return authInstance;
  authInstance = getAuth(getFirebaseApp());
  return authInstance;
}

// Collection names use heroquest- prefix
const USERS_COLLECTION = 'heroquest-users';
const REPOS_COLLECTION = 'heroquest-repos';
const USER_PROGRESS_COLLECTION = 'heroquest-user-progress';
const LEADERBOARD_COLLECTION = 'heroquest-leaderboard';

function normalizeRepoKey(repoKey = 'default') {
  return String(repoKey).trim().replaceAll('/', '__') || 'default';
}

// ---------------------------------------------------------------------------
// User data
// ---------------------------------------------------------------------------

/**
 * Save (upsert) a user's profile + stats document.
 * @param {{ username: string, [key: string]: any }} data  Must include `username`.
 */
export async function saveUserData(data) {
  if (!data?.username) throw new Error('saveUserData: data.username is required');
  const db = getDb();
  const ref = doc(db, USERS_COLLECTION, data.username);
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

/**
 * Retrieve a user document by username.
 * @param {string} username
 * @returns {Object|null} document data or null if not found
 */
export async function getUserData(username) {
  if (!username) throw new Error('getUserData: username is required');
  const db = getDb();
  const ref = doc(db, USERS_COLLECTION, username);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

// ---------------------------------------------------------------------------
// Repository data
// ---------------------------------------------------------------------------

/**
 * Save (upsert) repository stats for a user.
 * @param {{ username: string, repos: Array, [key: string]: any }} data  Must include `username`.
 */
export async function saveRepoData(data) {
  if (!data?.username) throw new Error('saveRepoData: data.username is required');
  const db = getDb();
  const ref = doc(db, REPOS_COLLECTION, data.username);
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

/**
 * Retrieve repository data for a user.
 * @param {string} username
 * @returns {Object|null} document data or null if not found
 */
export async function getRepoData(username) {
  if (!username) throw new Error('getRepoData: username is required');
  const db = getDb();
  const ref = doc(db, REPOS_COLLECTION, username);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function saveUserProgress(progress) {
  if (!progress?.username) throw new Error('saveUserProgress: progress.username is required');

  const db = getDb();
  const repoKey = normalizeRepoKey(progress.repoKey);
  const progressDocId = `${progress.username}__${repoKey}`;
  const progressRef = doc(db, USER_PROGRESS_COLLECTION, progressDocId);

  await setDoc(
    progressRef,
    {
      username: progress.username,
      repoKey,
      xp: Number(progress.xp ?? 0),
      level: Number(progress.level ?? 1),
      commits: Number(progress.commits ?? 0),
      mergedPRs: Number(progress.mergedPRs ?? 0),
      reviews: Number(progress.reviews ?? 0),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  const leaderboardRef = doc(db, LEADERBOARD_COLLECTION, progressDocId);
  await setDoc(
    leaderboardRef,
    {
      id: progressDocId,
      username: progress.username,
      repoKey,
      xp: Number(progress.xp ?? 0),
      level: Number(progress.level ?? 1),
      commits: Number(progress.commits ?? 0),
      mergedPRs: Number(progress.mergedPRs ?? 0),
      reviews: Number(progress.reviews ?? 0),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function subscribeLeaderboard({
  repoKey = 'default',
  maxRows = 20,
  onUpdate,
  onError,
} = {}) {
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
        .map((item) => ({ id: item.id, ...item.data() }))
        .sort((a, b) => Number(b.xp ?? 0) - Number(a.xp ?? 0))
        .slice(0, rows);
      onUpdate(records);
    },
    (error) => {
      if (typeof onError === 'function') onError(error);
    },
  );
}

export async function signInWithGitHubPopup() {
  const auth = getAuthInstance();
  const provider = new GithubAuthProvider();
  provider.addScope('read:user');
  provider.addScope('repo');
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
