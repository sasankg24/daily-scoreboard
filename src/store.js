// Store: the shared database (Firebase Firestore) and anonymous sign-in.
// Each phone signs in anonymously once and keeps its uid, so it can only change its own
// name and results (see firestore.rules). Everything else here is reading and writing.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInAnonymously,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore, collection, doc, onSnapshot, setDoc, deleteDoc, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { resultId, toResultDoc } from "./records.js";

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

/**
 * Signs in (anonymously, the first time) and calls the listeners with live data.
 * onReady(uid), onPlayers({uid: name}), onResults([resultDoc]), onError(error).
 */
export function connect({ onReady, onPlayers, onResults, onError }) {
  let unsubscribers = [];
  onAuthStateChanged(auth, (user) => {
    unsubscribers.forEach((u) => u());
    unsubscribers = [];
    if (!user) {
      signInAnonymously(auth).catch(onError);
      return;
    }
    onReady(user.uid);
    unsubscribers.push(onSnapshot(collection(db, "players"), (snap) => {
      const names = {};
      snap.forEach((d) => { names[d.id] = d.data().name; });
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

/** Saves this phone's name. */
export function saveName(name) {
  return setDoc(doc(db, "players", currentUid()), { name: name.trim(), joinedAt: serverTimestamp() });
}

/** Saves one result. Pasting the same game on the same day again replaces the earlier one. */
export function saveResult(player, parsed, date) {
  const uid = currentUid();
  const data = toResultDoc(uid, player, parsed, date, serverTimestamp());
  return setDoc(doc(db, "results", resultId(date, parsed.game, uid)), data);
}

/** Removes one of this phone's own results. The rules refuse anyone else's. */
export function removeResult(date, game) {
  return deleteDoc(doc(db, "results", resultId(date, game, currentUid())));
}
