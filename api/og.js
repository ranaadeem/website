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
    const rawDesc = (post.subtitle || (post.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200) || '').trim();
    const description = rawDesc.length > 10 ? rawDesc : 'Read the latest from The Lab Notebook by Dr. Adeem Ghaffar Rana — research, academic life, and navigating Germany as a Pakistani researcher.';
    // Transform Cloudinary URL to proper OG dimensions (1200x630)
    let image = post.coverImage || 'https://ranaadeem.de/og-banner.jpg';
    if (image.includes('cloudinary.com') && image.includes('/upload/')) {
      image = image.replace('/upload/', '/upload/c_fill,w_1200,h_630,f_jpg,q_auto/');
    }
    const author = post.authorName || 'Dr. Adeem Ghaffar Rana';
    const postUrl = `https://ranaadeem.de/blog/post.html?id=${id}`;

    // Detect if request is from a human or a bot
    const ua = (req.headers['user-agent'] || '').toLowerCase();
    const isBot = /linkedin|twitterbot|facebookexternalhit|whatsapp|telegrambot|slackbot|discordbot|googlebot|bingbot|crawler|spider|preview/.test(ua);
    const isHuman = !isBot;

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
  <meta property="og:title" content="${title.replace(/"/g, '&quot;')}">
  <meta property="og:description" content="${description.replace(/"/g, '&quot;')}">
  <meta name="image" property="og:image" content="${image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${postUrl}">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title.replace(/"/g, '&quot;')}">
  <meta name="twitter:description" content="${description.replace(/"/g, '&quot;')}">
  <meta name="twitter:image" content="${image}">
  <meta name="twitter:creator" content="@ranaadeem">

  <!-- WhatsApp uses OG tags -->
  <meta property="og:image:type" content="image/jpeg">

  <link rel="canonical" href="${postUrl}">
  <meta property="article:author" content="${escHtml(author)}">
  <meta property="article:published_time" content="${post.publishedAt ? new Date(post.publishedAt._seconds * 1000).toISOString() : new Date().toISOString()}">
  ${isHuman ? '<meta http-equiv="refresh" content="0;url=' + postUrl + '">' : ''}
</head>
<body>
  <p>Redirecting to <a href="${postUrl}">${escHtml(title)}</a>...</p>
  ${isHuman ? '<script>window.location.replace("' + postUrl + '");</script>' : ''}
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
