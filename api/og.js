import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({ credential: cert(serviceAccount) });
  } catch(e) {
    console.error('Firebase init error:', e.message);
  }
}

export default async function handler(req, res) {
  const id = req.query.id;
  console.log('OG request for id:', id);
  console.log('User-Agent:', req.headers['user-agent']);

  if (!id) {
    console.log('No ID - redirecting to blog');
    return res.redirect(302, '/blog.html');
  }

  let title = 'The Lab Notebook';
  let description = 'Research, academic life, navigating Germany, and anything else worth writing about.';
  let image = 'https://ranaadeem.de/og-banner.jpg';
  let postUrl = 'https://ranaadeem.de/blog/post.html?id=' + id;

  try {
    const db = getFirestore();
    const doc = await db.collection('posts').doc(id).get();
    console.log('Doc exists:', doc.exists);

    if (doc.exists) {
      const post = doc.data();
      console.log('Post title:', post.title);
      console.log('Post coverImage:', post.coverImage ? post.coverImage.slice(0, 80) : 'NONE');
      console.log('Post status:', post.status);

      title = post.title || title;

      const raw = (post.subtitle || (post.content || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 200)).trim();
      description = raw.length > 10 ? raw : description;

      if (post.coverImage && post.coverImage.startsWith('https://')) {
        image = post.coverImage;
        // Transform Cloudinary URL for proper dimensions
        if (image.includes('cloudinary.com/') && image.includes('/upload/')) {
          image = image.replace('/upload/', '/upload/c_fill,w_1200,h_630,f_jpg,q_auto/');
        }
      }
      console.log('Final image URL:', image);
    }
  } catch(e) {
    console.error('Firestore error:', e.message);
  }

  const safeTitle = title.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeDesc = description.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${safeTitle} — The Lab Notebook</title>
<meta name="description" content="${safeDesc}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="The Lab Notebook">
<meta property="og:title" content="${safeTitle}">
<meta property="og:description" content="${safeDesc}">
<meta property="og:image" content="${image}">
<meta property="og:image:secure_url" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:url" content="${postUrl}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${safeTitle}">
<meta name="twitter:description" content="${safeDesc}">
<meta name="twitter:image" content="${image}">
<meta name="twitter:site" content="@ranaadeem">
<link rel="canonical" href="${postUrl}">
<meta http-equiv="refresh" content="1;url=${postUrl}">
</head>
<body>
<h1>${safeTitle}</h1>
<p>${safeDesc}</p>
<img src="${image}" width="1200" height="630" alt="${safeTitle}">
<a href="${postUrl}">Read the full post</a>
<script>setTimeout(function(){window.location.replace('${postUrl}');},500);</script>
</body>
</html>`);
}
