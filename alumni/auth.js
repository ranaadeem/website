// auth.js — shared alumni authentication module
// ranaadeem.de · Firebase Email/Password Auth

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAgUl22Cln6QtY3-HIvI6lE8Zu7n9OblbI",
  authDomain: "icet-alumni.firebaseapp.com",
  projectId: "icet-alumni"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const ADMIN_UID = "w2AtZbhUiyY5TxyvIecHzWqheaE2";

// ── Sign In ──────────────────────────────────────────────────────────────────
export async function signIn(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  if (!cred.user.emailVerified) {
    await signOut(auth);
    throw { code: "auth/email-not-verified" };
  }
  return cred.user;
}

// ── Sign Out ─────────────────────────────────────────────────────────────────
export async function signOutUser() {
  await signOut(auth);
}

// ── Get alumni profile from Firestore ────────────────────────────────────────
export async function getAlumniProfile(uid) {
  const snap = await getDoc(doc(db, "alumni", uid));
  return snap.exists() ? snap.data() : null;
}

// ── Auth state watcher ───────────────────────────────────────────────────────
// Calls back with: { user, profile, status }
// status: 'admin' | 'approved' | 'pending' | 'unregistered' | 'signedout'
export function watchAuthState(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return callback({ user: null, profile: null, status: "signedout" });
    if (user.uid === ADMIN_UID) return callback({ user, profile: null, status: "admin" });
    const profile = await getAlumniProfile(user.uid);
    if (!profile) return callback({ user, profile: null, status: "unregistered" });
    callback({ user, profile, status: profile.status }); // 'pending' | 'approved'
  });
}

// ── Resend verification email ─────────────────────────────────────────────────
export async function resendVerification() {
  const user = auth.currentUser;
  if (user) await sendEmailVerification(user);
}

// ── Password reset ────────────────────────────────────────────────────────────
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}