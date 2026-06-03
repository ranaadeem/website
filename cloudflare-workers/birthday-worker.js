// birthday-worker.js
// Cron: 0 2 * * * (2am UTC = 7am PKT)
// Sends birthday emails to alumni and notifies opted-in batchmates

const FIREBASE_PROJECT = 'icet-alumni';
const RESEND_FROM = 'ICET Alumni Network <icet_alumni@ranaadeem.de>';

// ── Firebase JWT auth ─────────────────────────────────────────────────────────
async function getFirebaseToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header  = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/datastore'
  };

  const b64url = obj => btoa(JSON.stringify(obj)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  const sigInput = `${b64url(header)}.${b64url(payload)}`;

  const pemKey   = serviceAccount.private_key.replace(/\\n/g, '\n');
  const keyBody  = pemKey.replace(/-----[^-]+-----/g,'').replace(/\s/g,'');
  const keyBytes = Uint8Array.from(atob(keyBody), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', keyBytes,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(sigInput));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  const jwt = `${sigInput}.${sigB64}`;

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });
  const data = await resp.json();
  if (!data.access_token) throw new Error('Firebase token error: ' + JSON.stringify(data));
  return data.access_token;
}

// ── Firestore helpers ─────────────────────────────────────────────────────────
async function getAllAlumni(token) {
  let docs = [], pageToken = null;
  do {
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/alumni?pageSize=300${pageToken ? '&pageToken='+pageToken : ''}`;
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await resp.json();
    if (data.documents) docs = docs.concat(data.documents);
    pageToken = data.nextPageToken || null;
  } while (pageToken);
  return docs;
}

function field(doc, key) {
  const f = doc.fields?.[key];
  if (!f) return null;
  return f.stringValue ?? (f.booleanValue !== undefined ? f.booleanValue : null) ?? f.integerValue ?? null;
}

// ── Email helpers ─────────────────────────────────────────────────────────────
async function sendEmail(apiKey, to, subject, html) {
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ from: RESEND_FROM, to: [to], subject, html })
  });
  const result = await resp.json();
  if (!resp.ok) console.error(`Email failed to ${to}:`, JSON.stringify(result));
  return resp.ok;
}

function titleCase(name) {
  return (name || '').toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function birthdayEmailHtml(name, session) {
  const displayName = titleCase(name);
  const firstName = displayName.split(' ')[0];
  const sessionYear = (session || '').split('-')[0];
  return `
<div style="font-family:'DM Sans',Arial,sans-serif;max-width:560px;margin:0 auto;background:#f9f7f3;">
  <div style="background:#1a3a8a;padding:1.5rem 2rem;border-radius:12px 12px 0 0;border-bottom:3px solid #c9a84c;">
    <h1 style="font-family:Georgia,serif;color:#c9a84c;margin:0;font-size:1.3rem;letter-spacing:1px;">ICET Alumni Network</h1>
    <p style="color:rgba(255,255,255,0.6);margin:4px 0 0;font-size:12px;">Institute of Chemical Engineering &amp; Technology · University of the Punjab, Lahore</p>
  </div>
  <div style="background:#faf8f4;padding:2rem;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;">
    <div style="text-align:center;font-size:3.5rem;margin:0.5rem 0 1rem;">🎂</div>
    <h2 style="font-family:Georgia,serif;color:#1a3a8a;text-align:center;margin:0 0 0.75rem;">Happy Birthday, ${firstName}!</h2>
    <p style="color:#374151;line-height:1.8;text-align:center;font-size:15px;">Your ICET Chemical Engineering batchmates are thinking of you today.<br>Wishing you a wonderful year ahead! 🎉</p>
    <div style="background:white;border:1px solid #e5e7eb;border-left:4px solid #c9a84c;border-radius:0 8px 8px 0;padding:1rem 1.25rem;margin:1.5rem 0;text-align:center;">
      <p style="color:#1a3a8a;font-weight:700;margin:0;font-size:14px;">Session ${session}</p>
      <p style="color:#6b7280;font-size:12px;margin:4px 0 0;">ICET · University of the Punjab, Lahore</p>
    </div>
    <div style="text-align:center;margin:1.5rem 0;">
      <a href="https://ranaadeem.de/alumni/session.html?year=${sessionYear}" style="display:inline-block;background:#c9a84c;color:#1a3a8a;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Visit Your Session Page →</a>
    </div>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:1.5rem 0;">
    <p style="color:#9ca3af;font-size:11px;text-align:center;">ICET Alumni Network · <a href="https://ranaadeem.de/alumni.html" style="color:#1a3a8a;">ranaadeem.de/alumni.html</a></p>
  </div>
</div>`;
}

function batchmateNotifyHtml(birthdayName, session, recipientName) {
  const displayBirthday = titleCase(birthdayName);
  const displayRecipient = titleCase(recipientName);
  const firstName = displayRecipient.split(' ')[0];
  const sessionYear = (session || '').split('-')[0];
  return `
<div style="font-family:'DM Sans',Arial,sans-serif;max-width:560px;margin:0 auto;background:#f9f7f3;">
  <div style="background:#1a3a8a;padding:1.5rem 2rem;border-radius:12px 12px 0 0;border-bottom:3px solid #c9a84c;">
    <h1 style="font-family:Georgia,serif;color:#c9a84c;margin:0;font-size:1.3rem;letter-spacing:1px;">ICET Alumni Network</h1>
    <p style="color:rgba(255,255,255,0.6);margin:4px 0 0;font-size:12px;">Birthday Alert · Session ${session}</p>
  </div>
  <div style="background:#faf8f4;padding:2rem;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;">
    <p style="color:#374151;line-height:1.7;">Hi ${firstName},</p>
    <div style="background:white;border:1px solid #e5e7eb;border-left:4px solid #c9a84c;border-radius:0 8px 8px 0;padding:1.25rem;margin:1rem 0;display:flex;align-items:center;gap:12px;">
      <span style="font-size:2rem;">🎂</span>
      <div>
        <p style="color:#1a3a8a;font-weight:700;margin:0;font-size:15px;">It's ${displayBirthday}'s birthday today!</p>
        <p style="color:#6b7280;font-size:13px;margin:4px 0 0;">Your batchmate from Session ${session}</p>
      </div>
    </div>
    <p style="color:#374151;line-height:1.7;">Send them your wishes on the session page!</p>
    <div style="text-align:center;margin:1.5rem 0;">
      <a href="https://ranaadeem.de/alumni/session.html?year=${sessionYear}" style="display:inline-block;background:#c9a84c;color:#1a3a8a;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Send Birthday Wishes →</a>
    </div>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:1.5rem 0;">
    <p style="color:#9ca3af;font-size:11px;text-align:center;">
      You're receiving this because you enabled birthday notifications on your session page.<br>
      To turn off: visit your session page → click the 🔔 Birthdays button.<br>
      <a href="https://ranaadeem.de/alumni.html" style="color:#1a3a8a;">ranaadeem.de/alumni.html</a>
    </p>
  </div>
</div>`;
}

// ── Main logic ────────────────────────────────────────────────────────────────
async function run(env) {
  console.log('Birthday worker started:', new Date().toISOString());

  const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
  const token = await getFirebaseToken(serviceAccount);
  const docs  = await getAllAlumni(token);

  const now      = new Date();
  const todayM   = now.getUTCMonth() + 1;
  const todayD   = now.getUTCDate();

  const birthdayPeople = [];
  const notifyBySession = {}; // sessionYear -> [{name, email}]

  for (const doc of docs) {
    if (field(doc, 'status') !== 'approved') continue;

    const name    = field(doc, 'name');
    const email   = field(doc, 'email');
    const session = field(doc, 'session');
    const dob     = field(doc, 'dob');
    const notify  = field(doc, 'birthdayNotify');

    if (!name || !session) continue;

    // Parse dob (stored as YYYY-MM-DD)
    if (dob) {
      const parts = dob.split('-');
      let m, d;
      if (parts.length === 3) { m = parseInt(parts[1]); d = parseInt(parts[2]); }
      else if (parts.length === 2) { m = parseInt(parts[0]); d = parseInt(parts[1]); }
      if (m === todayM && d === todayD) {
        birthdayPeople.push({ name, email, session });
      }
    }

    // Collect batchmates who want notifications
    if (notify === true && email) {
      const yr = session.split('-')[0];
      if (!notifyBySession[yr]) notifyBySession[yr] = [];
      notifyBySession[yr].push({ name, email });
    }
  }

  console.log(`Found ${birthdayPeople.length} birthdays today`);

  for (const person of birthdayPeople) {
    // 1. Email the birthday person
    if (person.email) {
      await sendEmail(
        env.RESEND_API_KEY,
        person.email,
        `🎂 Happy Birthday ${titleCase(person.name).split(' ')[0]}! — ICET Alumni Network`,
        birthdayEmailHtml(person.name, person.session)
      );
      console.log(`Birthday email → ${person.name} (${person.email})`);
    }

    // 2. Notify opted-in batchmates (same session year)
    const yr = person.session.split('-')[0];
    for (const bm of (notifyBySession[yr] || [])) {
      if (bm.email === person.email) continue;
      await sendEmail(
        env.RESEND_API_KEY,
        bm.email,
        `🎂 It's ${titleCase(person.name)}'s birthday today! — ICET Alumni`,
        batchmateNotifyHtml(person.name, person.session, bm.name)
      );
      console.log(`Notified ${bm.name} about ${person.name}'s birthday`);
    }
  }

  console.log('Birthday worker done');
  return birthdayPeople.length;
}

// ── Worker export ─────────────────────────────────────────────────────────────
export default {
  // Cron trigger
  async scheduled(event, env, ctx) {
    ctx.waitUntil(run(env));
  },
  // Manual trigger: GET /?run=1  (for testing)
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.searchParams.get('run') === '1') {
      ctx.waitUntil(run(env));
      return new Response(JSON.stringify({ triggered: true, time: new Date().toISOString() }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response('ICET Birthday Worker — OK', { status: 200 });
  }
};
