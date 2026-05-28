export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, to, toName, data } = req.body;

  let subject, html;

  // ── BLOG EMAILS ────────────────────────────────────────────────────────────

  if (type === 'welcome') {
    subject = 'Welcome to The Lab Notebook';
    html = `
      <div style="font-family:'DM Sans',sans-serif;max-width:560px;margin:0 auto;padding:2rem;">
        <div style="background:#1a3a8a;padding:1.5rem 2rem;border-radius:10px 10px 0 0;">
          <h1 style="font-family:Georgia,serif;color:#c9a84c;margin:0;font-size:1.4rem;letter-spacing:2px;">AGR</h1>
          <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:13px;">The Lab Notebook</p>
        </div>
        <div style="background:#faf8f4;padding:2rem;border-radius:0 0 10px 10px;border:1px solid #e5e7eb;border-top:none;">
          <h2 style="font-family:Georgia,serif;color:#1a3a8a;margin-bottom:1rem;">You're subscribed ✓</h2>
          <p style="color:#374151;line-height:1.7;">Hi ${toName || 'there'},</p>
          <p style="color:#374151;line-height:1.7;">You're now subscribed to <strong>The Lab Notebook</strong> — research, academic life, navigating Germany, and anything else worth writing about.</p>
          <p style="color:#374151;line-height:1.7;">You'll receive an email when new posts are published.</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:1.5rem 0;">
          <p style="color:#6b7280;font-size:12px;">Dr. Adeem Ghaffar Rana · TU Bergakademie Freiberg · <a href="https://ranaadeem.de" style="color:#1a3a8a;">ranaadeem.de</a></p>
        </div>
      </div>`;

  } else if (type === 'new-post') {
    subject = `New post: ${data.postTitle}`;
    html = `
      <div style="font-family:'DM Sans',sans-serif;max-width:560px;margin:0 auto;padding:2rem;">
        <div style="background:#1a3a8a;padding:1.5rem 2rem;border-radius:10px 10px 0 0;">
          <h1 style="font-family:Georgia,serif;color:#c9a84c;margin:0;font-size:1.4rem;letter-spacing:2px;">AGR</h1>
          <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:13px;">The Lab Notebook</p>
        </div>
        <div style="background:#faf8f4;padding:2rem;border-radius:0 0 10px 10px;border:1px solid #e5e7eb;border-top:none;">
          <p style="color:#374151;line-height:1.7;">Hi ${toName || 'there'},</p>
          <p style="color:#374151;line-height:1.7;">A new post has been published:</p>
          <div style="background:white;border:1px solid #e5e7eb;border-left:3px solid #c9a84c;border-radius:0 8px 8px 0;padding:1rem 1.25rem;margin:1.25rem 0;">
            <h3 style="font-family:Georgia,serif;color:#1a3a8a;margin:0 0 4px;">${data.postTitle}</h3>
            <p style="color:#6b7280;font-size:13px;margin:0;">By ${data.postAuthor}</p>
          </div>
          <a href="${data.postUrl}" style="display:inline-block;background:#c9a84c;color:#1a3a8a;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Read Post →</a>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:1.5rem 0;">
          <p style="color:#6b7280;font-size:12px;">You're receiving this because you subscribed to The Lab Notebook. <a href="https://ranaadeem.de" style="color:#1a3a8a;">ranaadeem.de</a></p>
        </div>
      </div>`;

  } else if (type === 'new-submission') {
    subject = `New post submission: ${data.postTitle}`;
    html = `
      <div style="font-family:'DM Sans',sans-serif;max-width:560px;margin:0 auto;padding:2rem;">
        <div style="background:#1a3a8a;padding:1.5rem 2rem;border-radius:10px 10px 0 0;">
          <h1 style="font-family:Georgia,serif;color:#c9a84c;margin:0;font-size:1.4rem;">Admin Alert</h1>
          <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:13px;">The Lab Notebook</p>
        </div>
        <div style="background:#faf8f4;padding:2rem;border-radius:0 0 10px 10px;border:1px solid #e5e7eb;border-top:none;">
          <h2 style="color:#1a3a8a;">New post submitted for review</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin:1rem 0;">
            <tr><td style="padding:6px 0;color:#6b7280;width:100px;">Title</td><td style="padding:6px 0;color:#1a1a2e;font-weight:600;">${data.postTitle}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Author</td><td style="padding:6px 0;color:#1a1a2e;">${data.authorName}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Email</td><td style="padding:6px 0;color:#1a1a2e;">${data.authorEmail}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Category</td><td style="padding:6px 0;color:#1a1a2e;">${data.postCategory || 'Not set'}</td></tr>
          </table>
          <a href="https://ranaadeem.de/blog.html" style="display:inline-block;background:#c9a84c;color:#1a3a8a;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Review in Admin Panel →</a>
        </div>
      </div>`;

  } else if (type === 'comment') {
    subject = `New comment on your post: ${data.postTitle}`;
    html = `
      <div style="font-family:'DM Sans',sans-serif;max-width:560px;margin:0 auto;padding:2rem;">
        <div style="background:#1a3a8a;padding:1.5rem 2rem;border-radius:10px 10px 0 0;">
          <h1 style="font-family:Georgia,serif;color:#c9a84c;margin:0;font-size:1.4rem;">New Comment</h1>
          <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:13px;">The Lab Notebook</p>
        </div>
        <div style="background:#faf8f4;padding:2rem;border-radius:0 0 10px 10px;border:1px solid #e5e7eb;border-top:none;">
          <p style="color:#374151;">Hi ${data.authorName || 'there'},</p>
          <p style="color:#374151;"><strong>${data.commenterName}</strong> commented on your post <strong>${data.postTitle}</strong>:</p>
          <blockquote style="border-left:3px solid #c9a84c;padding:0.75rem 1rem;background:white;margin:1rem 0;border-radius:0 6px 6px 0;color:#374151;font-style:italic;">${data.commentText}</blockquote>
          <a href="${data.postUrl}" style="display:inline-block;background:#c9a84c;color:#1a3a8a;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">View Post →</a>
        </div>
      </div>`;

  } else if (type === 'photo-submission') {
    subject = `New batch photo submitted — Session ${data.session || ''}`;
    html = `
      <div style="font-family:'DM Sans',sans-serif;max-width:560px;margin:0 auto;padding:2rem;">
        <div style="background:#1a3a8a;padding:1.5rem 2rem;border-radius:10px 10px 0 0;">
          <h1 style="font-family:Georgia,serif;color:#c9a84c;margin:0;font-size:1.2rem;">Alumni Network</h1>
          <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:13px;">ICET Punjab University · Session ${data.session || ''}</p>
        </div>
        <div style="background:#faf8f4;padding:2rem;border-radius:0 0 10px 10px;border:1px solid #e5e7eb;border-top:none;">
          <h2 style="font-family:Georgia,serif;color:#1a3a8a;margin-bottom:1rem;">📸 New Batch Photo Submitted</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin:1rem 0;">
            <tr><td style="padding:6px 0;color:#6b7280;width:120px;">Submitted by</td><td style="padding:6px 0;color:#1a1a2e;font-weight:600;">${data.uploaderName || 'Unknown'}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Session</td><td style="padding:6px 0;color:#1a1a2e;">Session ${data.session || ''}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Caption</td><td style="padding:6px 0;color:#1a1a2e;">${data.caption || '(no caption)'}</td></tr>
          </table>
          <a href="https://ranaadeem.de/alumni/${data.session || '2006'}.html" style="display:inline-block;background:#c9a84c;color:#1a3a8a;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Review Photo →</a>
        </div>
      </div>`;

  // ── ALUMNI EMAILS ──────────────────────────────────────────────────────────

  } else if (type === 'alumni-verify') {
    // Email verification code — sent from noreply@ranaadeem.de
    subject = `${data.code} is your ICET Alumni verification code`;
    html = `
      <div style="font-family:'DM Sans',sans-serif;max-width:560px;margin:0 auto;padding:2rem;">
        <div style="background:#1a3a8a;padding:1.5rem 2rem;border-radius:10px 10px 0 0;border-bottom:3px solid #c9a84c;">
          <h1 style="font-family:Georgia,serif;color:#c9a84c;margin:0;font-size:1.3rem;">ICET Alumni Network</h1>
          <p style="color:rgba(255,255,255,0.65);margin:4px 0 0;font-size:12px;">Institute of Chemical Engineering &amp; Technology · University of the Punjab, Lahore</p>
        </div>
        <div style="background:#faf8f4;padding:2rem;border-radius:0 0 10px 10px;border:1px solid #e5e7eb;border-top:none;">
          <h2 style="font-family:Georgia,serif;color:#1a3a8a;margin-bottom:0.5rem;">Verify your email address</h2>
          <p style="color:#374151;line-height:1.7;margin-bottom:1.5rem;">Hi ${toName || 'there'},</p>
          <p style="color:#374151;line-height:1.7;">Enter this code on the registration page to verify your email and complete your alumni registration:</p>

          <div style="text-align:center;margin:2rem 0;">
            <div style="display:inline-block;background:#1a3a8a;color:#c9a84c;font-size:2.4rem;font-weight:700;letter-spacing:0.6em;padding:1rem 2rem;border-radius:10px;font-family:monospace;">
              ${data.code}
            </div>
            <p style="font-size:12px;color:#6b7280;margin-top:0.75rem;">This code expires in 30 minutes.</p>
          </div>

          <p style="color:#374151;line-height:1.7;">Once verified, your profile will be submitted for admin approval. You'll receive a confirmation email when approved.</p>

          <hr style="border:none;border-top:1px solid #e5e7eb;margin:1.5rem 0;">
          <p style="color:#6b7280;font-size:12px;">If you didn't create an account, you can safely ignore this email.<br>
          ICET Chemical Engineering Alumni Network · <a href="https://ranaadeem.de/alumni.html" style="color:#1a3a8a;">ranaadeem.de/alumni.html</a></p>
        </div>
      </div>`;

  } else if (type === 'alumni-approved') {
    // Sent when admin approves a registration
    subject = 'Your ICET Alumni profile has been approved!';
    html = `
      <div style="font-family:'DM Sans',sans-serif;max-width:560px;margin:0 auto;padding:2rem;">
        <div style="background:#1a3a8a;padding:1.5rem 2rem;border-radius:10px 10px 0 0;border-bottom:3px solid #c9a84c;">
          <h1 style="font-family:Georgia,serif;color:#c9a84c;margin:0;font-size:1.3rem;">ICET Alumni Network</h1>
          <p style="color:rgba(255,255,255,0.65);margin:4px 0 0;font-size:12px;">Institute of Chemical Engineering &amp; Technology · University of the Punjab, Lahore</p>
        </div>
        <div style="background:#faf8f4;padding:2rem;border-radius:0 0 10px 10px;border:1px solid #e5e7eb;border-top:none;">
          <h2 style="font-family:Georgia,serif;color:#1a3a8a;margin-bottom:0.5rem;">Welcome to the network! ✓</h2>
          <p style="color:#374151;line-height:1.7;">Hi ${toName || 'there'},</p>
          <p style="color:#374151;line-height:1.7;">Your ICET Alumni profile has been <strong style="color:#059669;">approved</strong>. You now have full access to your session directory, notice board, and announcements.</p>

          <div style="background:white;border:1px solid #e5e7eb;border-left:3px solid #c9a84c;border-radius:0 8px 8px 0;padding:1rem 1.25rem;margin:1.5rem 0;">
            <p style="color:#1a3a8a;font-weight:600;margin:0 0 4px;">Session ${data.session || ''}</p>
            <p style="color:#6b7280;font-size:13px;margin:0;">Roll: ${data.roll || ''}</p>
          </div>

          <a href="https://ranaadeem.de/alumni/${data.session || '2006'}.html" style="display:inline-block;background:#c9a84c;color:#1a3a8a;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Go to My Session Page →</a>

          <hr style="border:none;border-top:1px solid #e5e7eb;margin:1.5rem 0;">
          <p style="color:#6b7280;font-size:12px;">ICET Chemical Engineering Alumni Network · <a href="https://ranaadeem.de/alumni.html" style="color:#1a3a8a;">ranaadeem.de/alumni.html</a></p>
        </div>
      </div>`;

  } else {
    return res.status(400).json({ error: 'Unknown email type' });
  }

  // ── Send via Resend ────────────────────────────────────────────────────────
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set');
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    // Determine from name based on email type
    const isAlumniEmail = type === 'alumni-verify' || type === 'alumni-approved';
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