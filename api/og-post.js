// Serverless function to serve pre-rendered OG tags for blog posts
// LinkedIn and other crawlers that don't execute JS will get correct OG meta tags

const FIREBASE_PROJECT = 'icet-alumni';
const FIREBASE_API_KEY = 'AIzaSyAgUl22Cln6QtY3-HIvI6lE8Zu7n9OblbI';

export default async function handler(req, res) {
  const id = req.query.id;

  if (!id) {
    return res.redirect(302, '/blog/post.html');
  }

  // Detect social crawlers — serve OG page only to them
  const ua = req.headers['user-agent'] || '';
  const isCrawler = /linkedinbot|twitterbot|facebookexternalhit|whatsapp|telegrambot|slackbot|discordbot|pinterest|vkshare|w3c_validator|google|bingbot|yandex/i.test(ua);

  if (!isCrawler) {
    // Real user — send straight to the blog post page
    return res.redirect(302, `/blog/post.html?id=${id}`);
  }

  try {
    // Fetch post from Firestore REST API (no Admin SDK needed)
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/posts/${id}?key=${FIREBASE_API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) throw new Error('Post not found');

    const data = await response.json();
    const fields = data.fields || {};

    const title   = fields.title?.stringValue || 'Blog Post';
    const excerpt = fields.excerpt?.stringValue || fields.content?.stringValue?.slice(0, 160).replace(/<[^>]+>/g, '') || '';
    const cover   = fields.coverImage?.stringValue || 'https://ranaadeem.de/og-banner.jpg';
    const author  = fields.authorName?.stringValue || 'Dr. Adeem Ghaffar Rana';
    const postUrl = `https://ranaadeem.de/blog/post.html?id=${id}`;

    const seoTitle = `${title} — ${author}`;
    const seoDesc  = excerpt.length > 160 ? excerpt.slice(0, 157) + '...' : excerpt;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escHtml(seoTitle)}</title>
  <meta name="description" content="${escHtml(seoDesc)}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Dr. Adeem Ghaffar Rana">
  <meta property="og:url" content="${escHtml(postUrl)}">
  <meta property="og:title" content="${escHtml(seoTitle)}">
  <meta property="og:description" content="${escHtml(seoDesc)}">
  <meta property="og:image" content="${escHtml(cover)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escHtml(seoTitle)}">
  <meta name="twitter:description" content="${escHtml(seoDesc)}">
  <meta name="twitter:image" content="${escHtml(cover)}">
  <meta http-equiv="refresh" content="0;url=${escHtml(postUrl)}">
  <link rel="canonical" href="${escHtml(postUrl)}">
</head>
<body>
  <p>Redirecting to <a href="${escHtml(postUrl)}">${escHtml(seoTitle)}</a>…</p>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(html);

  } catch (err) {
    // Fallback — redirect to the post, better than an error
    return res.redirect(302, `/blog/post.html?id=${id}`);
  }
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
