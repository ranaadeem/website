import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Init Firebase Admin once
if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.redirect(302, '/blog.html');
  }

  try {
    const doc = await db.collection('posts').doc(id).get();

    if (!doc.exists || doc.data().status !== 'published') {
      return res.redirect(302, '/blog.html');
    }

    const post = doc.data();
    const title = post.title || 'The Lab Notebook';
    const description = post.subtitle || post.content?.replace(/<[^>]+>/g, ' ').slice(0, 160).trim() || 'Read on The Lab Notebook';
    const image = post.coverImage || 'https://ranaadeem.de/og-banner.jpg';
    const author = post.authorName || 'Dr. Adeem Ghaffar Rana';
    const postUrl = `https://ranaadeem.de/blog/post.html?id=${id}`;

    // Return HTML with OG tags + instant redirect for humans
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escHtml(title)} — The Lab Notebook</title>
  <meta name="description" content="${escHtml(description)}">

  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="The Lab Notebook">
  <meta property="og:title" content="${escHtml(title)}">
  <meta property="og:description" content="${escHtml(description)}">
  <meta property="og:image" content="${escHtml(image)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${postUrl}">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escHtml(title)}">
  <meta name="twitter:description" content="${escHtml(description)}">
  <meta name="twitter:image" content="${escHtml(image)}">
  <meta name="twitter:creator" content="@ranaadeem">

  <!-- WhatsApp uses OG tags -->
  <meta property="og:image:type" content="image/jpeg">

  <!-- Instant redirect for humans (bots ignore this) -->
  <meta http-equiv="refresh" content="0;url=${postUrl}">
  <link rel="canonical" href="${postUrl}">
</head>
<body>
  <p>Redirecting to <a href="${postUrl}">${escHtml(title)}</a>...</p>
  <script>window.location.replace('${postUrl}');</script>
</body>
</html>`);

  } catch(e) {
    console.error('OG error:', e);
    return res.redirect(302, '/blog.html');
  }
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
