export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, to, toName, data } = req.body;

  // Shared wrapper — mobile-safe, max 560px, no outer padding on small screens
  const wrap = (headerHtml, bodyHtml) => `
    <div style="font-family:'DM Sans',Arial,sans-serif;max-width:560px;margin:0 auto;padding:0;">
      <div style="background:#1a3a8a;padding:1.25rem 1.5rem;border-radius:10px 10px 0 0;border-bottom:3px solid #c9a84c;">
        ${headerHtml}
      </div>
      <div style="background:#faf8f4;padding:1.5rem;border-radius:0 0 10px 10px;border:1px solid #e5e7eb;border-top:none;">
        ${bodyHtml}
      </div>
    </div>`;

  const footer = (linkLabel, linkUrl) =>
    `<hr style="border:none;border-top:1px solid #e5e7eb;margin:1.25rem 0;">
     <p style="color:#6b7280;font-size:12px;line-height:1.6;">${linkLabel} · <a href="${linkUrl}" style="color:#1a3a8a;">${linkUrl.replace('https://','')}</a></p>`;

  const btn = (label, url) =>
    `<a href="${url}" style="display:inline-block;background:#c9a84c;color:#1a3a8a;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;margin-top:1rem;">${label}</a>`;

  const highlight = (content) =>
    `<div style="background:white;border:1px solid #e5e7eb;border-left:3px solid #c9a84c;border-radius:0 8px 8px 0;padding:0.9rem 1.1rem;margin:1.25rem 0;">${content}</div>`;

  let subject, html;

  // ── BLOG EMAILS ────────────────────────────────────────────────────────────

  if (type === 'welcome') {
    subject = 'Welcome to The Lab Notebook';
    html = wrap(
      `<h1 style="font-family:Georgia,serif;color:#c9a84c;margin:0;font-size:1.3rem;letter-spacing:2px;">AGR</h1>
       <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:12px;">The Lab Notebook</p>`,
      `<h2 style="font-family:Georgia,serif;color:#1a3a8a;margin-bottom:1rem;">You're subscribed ✓</h2>
       <p style="color:#374151;line-height:1.7;margin-bottom:0.75rem;">Hi ${toName || 'there'},</p>
       <p style="color:#374151;line-height:1.7;margin-bottom:0.75rem;">You're now subscribed to <strong>The Lab Notebook</strong> — research, academic life, navigating Germany, and anything else worth writing about.</p>
       <p style="color:#374151;line-height:1.7;">You'll receive an email when new posts are published.</p>
       ${footer('Dr. Adeem Ghaffar Rana · TU Bergakademie Freiberg', 'https://ranaadeem.de')}`
    );

  } else if (type === 'new-post') {
    subject = `New post: ${data.postTitle}`;
    html = wrap(
      `<h1 style="font-family:Georgia,serif;color:#c9a84c;margin:0;font-size:1.3rem;letter-spacing:2px;">AGR</h1>
       <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:12px;">The Lab Notebook</p>`,
      `<p style="color:#374151;line-height:1.7;margin-bottom:0.75rem;">Hi ${toName || 'there'},</p>
       <p style="color:#374151;line-height:1.7;margin-bottom:0.5rem;">A new post has been published:</p>
       ${highlight(`<h3 style="font-family:Georgia,serif;color:#1a3a8a;margin:0 0 4px;font-size:1rem;">${data.postTitle}</h3>
         <p style="color:#6b7280;font-size:13px;margin:0;">By ${data.postAuthor}</p>`)}
       ${btn('Read Post →', data.postUrl)}
       ${footer('You\'re receiving this because you subscribed to The Lab Notebook', 'https://ranaadeem.de')}`
    );

  } else if (type === 'new-submission') {
    subject = `New post submission: ${data.postTitle}`;
    html = wrap(
      `<h1 style="font-family:Georgia,serif;color:#c9a84c;margin:0;font-size:1.2rem;">Admin Alert</h1>
       <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:12px;">The Lab Notebook</p>`,
      `<h2 style="color:#1a3a8a;margin-bottom:1rem;font-size:1.1rem;">New post submitted for review</h2>
       <table style="width:100%;border-collapse:collapse;font-size:14px;margin:0.75rem 0;">
         <tr><td style="padding:6px 0;color:#6b7280;width:90px;vertical-align:top;">Title</td><td style="padding:6px 0;color:#1a1a2e;font-weight:600;">${data.postTitle}</td></tr>
         <tr><td style="padding:6px 0;color:#6b7280;vertical-align:top;">Author</td><td style="padding:6px 0;color:#1a1a2e;">${data.authorName}</td></tr>
         <tr><td style="padding:6px 0;color:#6b7280;vertical-align:top;">Email</td><td style="padding:6px 0;color:#1a1a2e;">${data.authorEmail}</td></tr>
         <tr><td style="padding:6px 0;color:#6b7280;vertical-align:top;">Category</td><td style="padding:6px 0;color:#1a1a2e;">${data.postCategory || 'Not set'}</td></tr>
       </table>
       ${btn('Review in Admin Panel →', 'https://ranaadeem.de/blog/')}`
    );

  } else if (type === 'comment') {
    subject = `New comment on your post: ${data.postTitle}`;
    html = wrap(
      `<h1 style="font-family:Georgia,serif;color:#c9a84c;margin:0;font-size:1.3rem;">New Comment</h1>
       <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:12px;">The Lab Notebook</p>`,
      `<p style="color:#374151;margin-bottom:0.75rem;">Hi ${data.authorName || 'there'},</p>
       <p style="color:#374151;margin-bottom:0.75rem;"><strong>${data.commenterName}</strong> commented on your post <strong>${data.postTitle}</strong>:</p>
       <blockquote style="border-left:3px solid #c9a84c;padding:0.75rem 1rem;background:white;margin:1rem 0;border-radius:0 6px 6px 0;color:#374151;font-style:italic;">${data.commentText}</blockquote>
       ${btn('View Post →', data.postUrl)}`
    );

  } else if (type === 'photo-submission') {
    subject = `New batch photo submitted — Session ${data.session || ''}`;
    html = wrap(
      `<h1 style="font-family:Georgia,serif;color:#c9a84c;margin:0;font-size:1.2rem;">Alumni Network</h1>
       <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:12px;">ICET Punjab University · Session ${data.session || ''}</p>`,
      `<h2 style="font-family:Georgia,serif;color:#1a3a8a;margin-bottom:1rem;font-size:1.1rem;">📸 New Batch Photo Submitted</h2>
       <table style="width:100%;border-collapse:collapse;font-size:14px;margin:0.75rem 0;">
         <tr><td style="padding:6px 0;color:#6b7280;width:110px;vertical-align:top;">Submitted by</td><td style="padding:6px 0;color:#1a1a2e;font-weight:600;">${data.uploaderName || 'Unknown'}</td></tr>
         <tr><td style="padding:6px 0;color:#6b7280;vertical-align:top;">Session</td><td style="padding:6px 0;color:#1a1a2e;">Session ${data.session || ''}</td></tr>
         <tr><td style="padding:6px 0;color:#6b7280;vertical-align:top;">Caption</td><td style="padding:6px 0;color:#1a1a2e;">${data.caption || '(no caption)'}</td></tr>
       </table>
       ${btn('Review Photo →', `https://ranaadeem.de/alumni/${data.session || '2006'}.html`)}`
    );

  // ── ALUMNI EMAILS ──────────────────────────────────────────────────────────

  } else if (type === 'alumni-verify') {
    subject = `${data.code} is your ICET Alumni verification code`;
    html = wrap(
      `<h1 style="font-family:Georgia,serif;color:#c9a84c;margin:0;font-size:1.3rem;">ICET Alumni Network</h1>
       <p style="color:rgba(255,255,255,0.65);margin:4px 0 0;font-size:12px;">Institute of Chemical Engineering &amp; Technology · University of the Punjab, Lahore</p>`,
      `<h2 style="font-family:Georgia,serif;color:#1a3a8a;margin-bottom:0.5rem;font-size:1.2rem;">Verify your email address</h2>
       <p style="color:#374151;line-height:1.7;margin-bottom:0.5rem;">Hi ${toName || 'there'},</p>
       <p style="color:#374151;line-height:1.7;margin-bottom:1.5rem;">Enter this code on the registration page to verify your email:</p>

       <div style="text-align:center;margin:1.5rem 0;">
         <div style="display:inline-block;background:#1a3a8a;color:#c9a84c;font-size:2rem;font-weight:700;letter-spacing:0.3em;padding:0.9rem 1.5rem;border-radius:10px;font-family:'Courier New',monospace;word-break:break-all;">
           ${data.code}
         </div>
         <p style="font-size:12px;color:#6b7280;margin-top:0.75rem;">This code expires in 30 minutes.</p>
       </div>

       <p style="color:#374151;line-height:1.7;font-size:14px;">Once verified, your profile will be submitted for admin approval. You'll receive a confirmation email when approved.</p>
       ${footer('If you didn\'t create an account, you can safely ignore this email.<br>ICET Chemical Engineering Alumni Network', 'https://ranaadeem.de/alumni/')}`
    );

  } else if (type === 'alumni-approved') {
    subject = 'Your ICET Alumni profile has been approved!';
    html = wrap(
      `<h1 style="font-family:Georgia,serif;color:#c9a84c;margin:0;font-size:1.3rem;">ICET Alumni Network</h1>
       <p style="color:rgba(255,255,255,0.65);margin:4px 0 0;font-size:12px;">Institute of Chemical Engineering &amp; Technology · University of the Punjab, Lahore</p>`,
      `<h2 style="font-family:Georgia,serif;color:#1a3a8a;margin-bottom:0.5rem;font-size:1.2rem;">Welcome to the network! ✓</h2>
       <p style="color:#374151;line-height:1.7;margin-bottom:0.75rem;">Hi ${toName || 'there'},</p>
       <p style="color:#374151;line-height:1.7;margin-bottom:1rem;">Your ICET Alumni profile has been <strong style="color:#059669;">approved</strong>. You now have full access to your session directory, notice board, and announcements.</p>
       ${highlight(`<p style="color:#1a3a8a;font-weight:600;margin:0 0 4px;">Session ${data.session || ''}</p>
         <p style="color:#6b7280;font-size:13px;margin:0;">Roll: ${data.roll || ''}</p>`)}
       ${btn('Go to My Session Page →', `https://ranaadeem.de/alumni/${data.session || '2006'}.html`)}
       ${footer('ICET Chemical Engineering Alumni Network', 'https://ranaadeem.de/alumni/')}`
    );

  } else if (type === 'alumni-pending') {
    subject = 'ICET Alumni — Registration received, pending approval';
    html = wrap(
      `<h1 style="font-family:Georgia,serif;color:#c9a84c;margin:0;font-size:1.3rem;">ICET Alumni Network</h1>
       <p style="color:rgba(255,255,255,0.65);margin:4px 0 0;font-size:12px;">Institute of Chemical Engineering &amp; Technology · University of the Punjab, Lahore</p>`,
      `<h2 style="font-family:Georgia,serif;color:#1a3a8a;margin-bottom:0.5rem;font-size:1.2rem;">Registration received ✓</h2>
       <p style="color:#374151;line-height:1.7;margin-bottom:0.75rem;">Hi ${toName || 'there'},</p>
       <p style="color:#374151;line-height:1.7;margin-bottom:1rem;">Your email has been verified and your ICET Alumni profile has been submitted for review. You'll receive another email once an admin approves your profile.</p>
       ${highlight(`<p style="color:#1a3a8a;font-weight:600;margin:0 0 4px;">Your details</p>
         <p style="color:#6b7280;font-size:13px;margin:0;">Roll: ${data.roll || ''} &nbsp;·&nbsp; Session ${data.session || ''}</p>`)}
       <p style="color:#374151;line-height:1.7;font-size:13px;">This usually takes 24–48 hours. Thank you for your patience.</p>
       ${footer('ICET Chemical Engineering Alumni Network', 'https://ranaadeem.de/alumni/')}`
    );

  } else if (type === 'alumni-registration-notify') {
    subject = `New alumni registration: ${data.name} (${data.roll})`;
    html = wrap(
      `<h1 style="font-family:Georgia,serif;color:#c9a84c;margin:0;font-size:1.3rem;">Admin Alert</h1>
       <p style="color:rgba(255,255,255,0.65);margin:4px 0 0;font-size:12px;">ICET Alumni Network</p>`,
      `<h2 style="font-family:Georgia,serif;color:#1a3a8a;margin-bottom:1rem;font-size:1.1rem;">New registration pending approval</h2>
       <table style="width:100%;border-collapse:collapse;font-size:14px;margin:0.75rem 0;">
         <tr><td style="padding:6px 0;color:#6b7280;width:90px;vertical-align:top;">Name</td><td style="padding:6px 0;color:#1a1a2e;font-weight:600;">${data.name}</td></tr>
         <tr><td style="padding:6px 0;color:#6b7280;vertical-align:top;">Roll</td><td style="padding:6px 0;color:#1a1a2e;">${data.roll}</td></tr>
         <tr><td style="padding:6px 0;color:#6b7280;vertical-align:top;">Session</td><td style="padding:6px 0;color:#1a1a2e;">Session ${data.session}</td></tr>
         <tr><td style="padding:6px 0;color:#6b7280;vertical-align:top;">Email</td><td style="padding:6px 0;color:#1a1a2e;word-break:break-all;">${data.email}</td></tr>
         <tr><td style="padding:6px 0;color:#6b7280;vertical-align:top;">Location</td><td style="padding:6px 0;color:#1a1a2e;">${data.city || ''}${data.city && data.country ? ', ' : ''}${data.country || ''}</td></tr>
         <tr><td style="padding:6px 0;color:#6b7280;vertical-align:top;">Position</td><td style="padding:6px 0;color:#1a1a2e;">${data.position || ''} at ${data.employer || ''}</td></tr>
       </table>
       ${btn('Review in Admin Panel →', 'https://ranaadeem.de/alumni/admin.html')}
       ${footer('ICET Alumni Admin', 'https://ranaadeem.de/alumni/admin.html')}`
    );

  } else {
    return res.status(400).json({ error: 'Unknown email type' });
  }

  // ── Send via Resend ────────────────────────────────────────────────────────
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set');
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const isAlumniEmail = ['alumni-verify','alumni-approved','alumni-pending','alumni-registration-notify'].includes(type);
    const fromName = isAlumniEmail ? 'ICET Alumni Network' : 'The Lab Notebook';

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.RESEND_API_KEY
      },
      body: JSON.stringify({
        from: `${fromName} <noreply@ranaadeem.de>`,
        to: type === 'new-submission'
          ? ['ranaadeem@hotmail.com']
          : type === 'alumni-registration-notify'
          ? ['ranaadeem@gmail.com']
          : type === 'comment'
          ? (data.authorEmail && data.authorEmail !== 'ranaadeem@hotmail.com'
              ? [data.authorEmail, 'ranaadeem@hotmail.com']
              : ['ranaadeem@hotmail.com'])
          : [to],
        subject,
        html
      })
    });

    const result = await response.json();
    if (!response.ok) {
      console.error('Resend error:', JSON.stringify(result));
      return res.status(500).json({ error: result.message || result.name || 'Email failed', details: result });
    }
    return res.status(200).json({ success: true, id: result.id });
  } catch(e) {
    console.error('Send error:', e);
    return res.status(500).json({ error: e.message });
  }
}
