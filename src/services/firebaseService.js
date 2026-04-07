import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDcPDZdXSnLfGGOgTzA__ka-6OPNZ7KTvc',
  authDomain: 'dh2642-iprog-dinnerplanner.firebaseapp.com',
  projectId: 'dh2642-iprog-dinnerplanner',
  storageBucket: 'dh2642-iprog-dinnerplanner.firebasestorage.app',
  messagingSenderId: '229770848981',
  appId: '1:229770848981:web:509fbb978233521a71105c',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collection names use heroquest- prefix
const USERS_COLLECTION = 'heroquest-users';
const REPOS_COLLECTION = 'heroquest-repos';

// ---------------------------------------------------------------------------
// User data
// ---------------------------------------------------------------------------

/**
 * Save (upsert) a user's profile + stats document.
 * @param {{ username: string, [key: string]: any }} data  Must include `username`.
 */
export async function saveUserData(data) {
  if (!data?.username) throw new Error('saveUserData: data.username is required');
  const ref = doc(db, USERS_COLLECTION, data.username);
  await setDoc(ref, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
}

/**
 * Retrieve a user document by username.
 * @param {string} username
 * @returns {Object|null} document data or null if not found
 */
export async function getUserData(username) {
  if (!username) throw new Error('getUserData: username is required');
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
  const ref = doc(db, REPOS_COLLECTION, data.username);
  await setDoc(ref, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
}

/**
 * Retrieve repository data for a user.
 * @param {string} username
 * @returns {Object|null} document data or null if not found
 */
export async function getRepoData(username) {
  if (!username) throw new Error('getRepoData: username is required');
  const ref = doc(db, REPOS_COLLECTION, username);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

// ---------------------------------------------------------------------------
// Graded stubs — to be implemented
// ---------------------------------------------------------------------------

export async function saveUserProgress() {
  // to do(graded): implement Firebase Auth + per-user persisted progress and quests.
  throw new Error('Firebase not configured yet');
}

export async function subscribeLeaderboard() {
  // to do(graded): implement real-time leaderboard updates (collaboration).
  throw new Error('Firebase not configured yet');
}
