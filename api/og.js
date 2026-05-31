// OG tag server-side renderer for blog posts
// Uses Firebase JS SDK (same as browser frontend — works with existing Firestore rules)
// Social crawlers hit /api/og?id=POST_ID → get proper OG meta tags → redirect to post

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAgUl22Cln6QtY3-HIvI6lE8Zu7n9OblbI",
  authDomain: "icet-alumni.firebaseapp.com",
  projectId: "icet-alumni",
  storageBucket: "icet-alumni.firebasestorage.app",
  messagingSenderId: "707390888790",
  appId: "1:707390888790:web:57e6be62e4d11e22c214f7"
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}
const db = getFirestore(app);

export default async function handler(req, res) {
  const id = req.query.id;

  let title = 'The Lab Notebook';
  let description = 'Research, academic life, navigating Germany, and anything else worth writing about.';
  let image = 'https://ranaadeem.de/og-banner.jpg';
  const postUrl = id
    ? 'https://ranaadeem.de/blog/post.html?id=' + id
    : 'https://ranaadeem.de/blog.html';

  if (!id) {
    return res.redirect(302, '/blog.html');
  }

  try {
    const snap = await getDoc(doc(db, 'posts', id));

    if (snap.exists()) {
      const post = snap.data();

      // Only serve published posts
      if (post.status === 'published') {
        if (post.title) title = post.title;

        // Description: subtitle or first 220 chars of stripped content
        const rawDesc = post.subtitle ||
          (post.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 220);
        if (rawDesc && rawDesc.length > 10) description = rawDesc;

        // Cover image: Cloudinary https URL (preferred)
        if (post.coverImage && post.coverImage.startsWith('https://')) {
          image = post.coverImage;
          // Transform for proper 1200×630 OG dimensions
          if (image.includes('cloudinary.com/') && image.includes('/upload/')) {
            image = image.replace('/upload/', '/upload/c_fill,w_1200,h_630,f_jpg,q_auto/');
          }
        }
        // Fallback: base64 image stored directly — upload to Cloudinary now
        else if (post.coverImage && post.coverImage.startsWith('data:image')) {
          try {
            const formData = new FormData();
            const blob = await (await fetch(post.coverImage)).blob();
            formData.append('file', blob, 'cover.jpg');
            formData.append('upload_preset', 'ranaadeem_blog');
            const r = await fetch('https://api.cloudinary.com/v1_1/duetiv9rm/image/upload', { method: 'POST', body: formData });
            const d = await r.json();
            if (d.secure_url) {
              image = d.secure_url.replace('/upload/', '/upload/c_fill,w_1200,h_630,f_jpg,q_auto/');
              // Also save the Cloudinary URL back to Firestore so future requests don't re-upload
              const { updateDoc } = await import('firebase/firestore');
              await updateDoc(doc(db, 'posts', id), { coverImage: d.secure_url }).catch(() => {});
            }
          } catch (e) {
            console.error('Base64 upload error:', e.message);
          }
        }
      }
    }
  } catch (e) {
    console.error('OG fetch error:', e.message);
    // Falls back to site defaults — harmless
  }

  const safe = s => String(s).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeTitle = safe(title);
  const safeDesc = safe(description);
  const safeImage = image.replace(/"/g, '%22');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Cache 5 min on CDN so crawlers are fast, but not stale too long
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${safeTitle} — The Lab Notebook</title>
<meta name="description" content="${safeDesc}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="The Lab Notebook · Dr. Adeem Ghaffar Rana">
<meta property="og:title" content="${safeTitle}">
<meta property="og:description" content="${safeDesc}">
<meta property="og:image" content="${safeImage}">
<meta property="og:image:secure_url" content="${safeImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:url" content="${postUrl}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${safeTitle}">
<meta name="twitter:description" content="${safeDesc}">
<meta name="twitter:image" content="${safeImage}">
<meta name="twitter:site" content="@ranaadeem">
<link rel="canonical" href="${postUrl}">
<meta http-equiv="refresh" content="0;url=${postUrl}">
</head>
<body>
<h1>${safeTitle}</h1>
<p>${safeDesc}</p>
<img src="${safeImage}" width="1200" height="630" alt="${safeTitle}">
<a href="${postUrl}">Read the full post →</a>
<script>window.location.replace('${postUrl}');</script>
</body>
</html>`);
}
