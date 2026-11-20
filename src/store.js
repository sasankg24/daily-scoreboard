// Store: the shared database (Firebase Firestore) and accounts.
// An account is a name and a password, so a friend can sign in as themselves on any device.
// The security rules (firestore.rules) only let an account write its own name and results.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut as firebaseSignOut, updateProfile,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore, collection, doc, onSnapshot, setDoc, deleteDoc, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { resultId, toResultDoc, loginEmail, LOGIN_DOMAIN } from "./records.js";

// The web config is public by design; firestore.rules is what protects the data.
const firebaseConfig = {
  apiKey: "AIzaSyBhul05mDc8_hnD0BtRTJrSfIc3bEueli0",
  authDomain: "daily-scoreboard.firebaseapp.com",
  projectId: "daily-scoreboard",
  storageBucket: "daily-scoreboard.firebasestorage.app",
  messagingSenderId: "225242823304",
  appId: "1:225242823304:web:8b2029d57854e6a0b1bd3d",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/** The name shown for an account: as typed at sign-up, or the login address before the @. */
function displayNameOf(user) {
  return user.displayName || user.email.replace(`@${LOGIN_DOMAIN}`, "");
}

/** Makes sure the signed-in account has its players entry (and repairs it if sign-up was cut off). */
function ensurePlayer(user) {
  return setDoc(doc(db, "players", user.uid), { name: displayNameOf(user), joinedAt: serverTimestamp() });
}

/**
 * Watches sign-in and, while signed in, the live data.
 * onSignedIn(uid, name), onSignedOut(), onPlayers({uid: name}), onResults([resultDoc]), onError(error).
 */
export function connect({ onSignedIn, onSignedOut, onPlayers, onResults, onError }) {
  let unsubscribers = [];
  onAuthStateChanged(auth, (user) => {
    unsubscribers.forEach((u) => u());
    unsubscribers = [];
    if (!user) {
      onSignedOut();
      return;
    }
    if (user.isAnonymous || !user.email) {
      // A phone-only sign-in from before accounts existed: sign it out so the friend can sign
      // in or create an account. Their earlier results stay on the scoreboard under their name.
      firebaseSignOut(auth).catch(onError);
      return;
    }
    onSignedIn(user.uid, displayNameOf(user));
    unsubscribers.push(onSnapshot(collection(db, "players"), (snap) => {
      const names = {};
      snap.forEach((d) => { names[d.id] = d.data().name; });
      if (!names[user.uid]) {
        ensurePlayer(user).catch(onError);
      }
      onPlayers(names);
    }, onError));
    unsubscribers.push(onSnapshot(collection(db, "results"), (snap) => {
      onResults(snap.docs.map((d) => d.data()));
    }, onError));
  });
}

export function currentUid() {
  return auth.currentUser ? auth.currentUser.uid : null;
}

/** Creates an account. The name is kept as typed for display. */
export async function signUp(name, password) {
  const trimmed = name.trim();
  const { user } = await createUserWithEmailAndPassword(auth, loginEmail(trimmed), password);
  await updateProfile(user, { displayName: trimmed });
  await ensurePlayer(user);
}

export function signIn(name, password) {
  return signInWithEmailAndPassword(auth, loginEmail(name), password);
}

export function signOut() {
  return firebaseSignOut(auth);
}

/** Saves one result. Pasting the same game on the same day again replaces the earlier one. */
export function saveResult(player, parsed, date) {
  const uid = currentUid();
  const data = toResultDoc(uid, player, parsed, date, serverTimestamp());
  return setDoc(doc(db, "results", resultId(date, parsed.game, uid)), data);
}

/** Removes one of this account's own results. The rules refuse anyone else's. */
export function removeResult(date, game) {
  return deleteDoc(doc(db, "results", resultId(date, game, currentUid())));
}
