// OG tag server-side renderer for blog posts
// Uses Firestore REST API (no service account needed — public read access)
// Social crawlers hit /api/og?id=POST_ID → get proper meta tags → redirect to post

const PROJECT_ID = 'icet-alumni';

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
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/posts/${encodeURIComponent(id)}`;
    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      const fields = data.fields || {};

      // Only serve published posts
      const status = fields.status?.stringValue;
      if (status === 'published' || status === 'Published') {
        if (fields.title?.stringValue) {
          title = fields.title.stringValue;
        }

        // Description: subtitle or first 200 chars of content
        const subtitle = fields.subtitle?.stringValue || '';
        const content = fields.content?.stringValue || '';
        const rawDesc = subtitle || content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
        if (rawDesc.length > 10) description = rawDesc;

        // Cover image — must be an https Cloudinary URL
        const cover = fields.coverImage?.stringValue || '';
        if (cover.startsWith('https://')) {
          image = cover;
          // Transform Cloudinary URL for optimal 1200×630 OG dimensions
          if (image.includes('cloudinary.com/') && image.includes('/upload/')) {
            image = image.replace('/upload/', '/upload/c_fill,w_1200,h_630,f_jpg,q_auto/');
          }
        }
      }
    }
  } catch (e) {
    // Fallback to defaults on any error
    console.error('OG fetch error:', e.message);
  }

  const safeTitle = title.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeDesc = description.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeImage = image.replace(/"/g, '%22');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
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
