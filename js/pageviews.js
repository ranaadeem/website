// pageviews.js — shared page view counter for static pages
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot, increment } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const FB_CFG = {
  apiKey: "AIzaSyAgUl22Cln6QtY3-HIvI6lE8Zu7n9OblbI",
  authDomain: "icet-alumni.firebaseapp.com",
  projectId: "icet-alumni"
};

const app = getApps().length ? getApp() : initializeApp(FB_CFG);
const db  = getFirestore(app);

// Normalize path to a Firestore-safe doc ID
const raw    = location.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
const pageId = (raw === '' || raw === '/') ? 'home' : raw.replace(/^\/+/, '').replace(/\//g, '__');

// Count once per browser session (avoids counting every refresh)
const sessionKey = 'pv__' + pageId;
if (!sessionStorage.getItem(sessionKey)) {
  sessionStorage.setItem(sessionKey, '1');
  setDoc(doc(db, 'pageViews', pageId), {
    path:  location.pathname,
    views: increment(1)
  }, { merge: true }).catch(() => {});
}

// Listen for live count and update all .pv-counter elements
onSnapshot(doc(db, 'pageViews', pageId), snap => {
  const v = snap.data()?.views;
  if (!v) return;
  document.querySelectorAll('.pv-counter').forEach(el => {
    el.textContent = '👁 ' + Number(v).toLocaleString() + ' views';
  });
}, () => {});
