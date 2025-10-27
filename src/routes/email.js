const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
// Do not require langchain at top-level (it can be ESM-only and cause startup errors).
// We'll use the official `openai` package dynamically inside the classify handler when needed.

function ensureAuthenticated(req, res, next) {
  if (req.session && req.session.tokens) return next();
  return res.status(401).json({ error: 'Not authenticated with Google' });
}

async function fetchEmailsFromGmail(tokens, limit = 15) {
  // Create OAuth2 client with application credentials so it can refresh tokens if needed
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL || `${process.env.SERVER_ROOT_URL || 'http://localhost:4000'}/auth/google/callback`
  );

  // Attach whatever tokens we have. Google library will use refresh_token to obtain a fresh access token when needed.
  const creds = {};
  if (tokens.accessToken) creds.access_token = tokens.accessToken;
  if (tokens.refreshToken) creds.refresh_token = tokens.refreshToken;
  oAuth2Client.setCredentials(creds);

  // Ensure we have a valid access token: if missing but we have a refresh_token, attempt to refresh.
  if ((!creds.access_token || creds.access_token === '') && creds.refresh_token) {
    try {
      const r = await oAuth2Client.getAccessToken();
      // getAccessToken may return a string or an object depending on version
      const newToken = r?.token || r;
      if (newToken) {
        oAuth2Client.setCredentials({ access_token: newToken, refresh_token: creds.refresh_token });
      }
    } catch (err) {
      console.warn('Failed to refresh access token', err?.message || err);
    }
  }

  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

  const listRes = await gmail.users.messages.list({ userId: 'me', maxResults: limit });
  const messages = listRes.data.messages || [];

  const results = [];
  for (const msg of messages) {
    const m = await gmail.users.messages.get({ userId: 'me', id: msg.id, format: 'metadata', metadataHeaders: ['From', 'Subject', 'Date'] });
    const headers = m.data.payload && m.data.payload.headers ? m.data.payload.headers : [];
    const headerMap = {};
    headers.forEach(h => (headerMap[h.name] = h.value));
    results.push({
      id: m.data.id,
      threadId: m.data.threadId,
      snippet: m.data.snippet || '',
      from: headerMap['From'] || '',
      subject: headerMap['Subject'] || '',
      date: headerMap['Date'] || '',
    });
  }

  return results;
}

async function fetchEmailContent(tokens, emailId) {
  // Create OAuth2 client
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL || `${process.env.SERVER_ROOT_URL || 'http://localhost:4000'}/auth/google/callback`
  );

  const creds = {};
  if (tokens.accessToken) creds.access_token = tokens.accessToken;
  if (tokens.refreshToken) creds.refresh_token = tokens.refreshToken;
  oAuth2Client.setCredentials(creds);

  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
  const message = await gmail.users.messages.get({ userId: 'me', id: emailId, format: 'full' });

  // Helper function to decode base64
  function decodeBase64(str) {
    if (!str) return '';
    try {
      return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
    } catch (e) {
      try {
        return Buffer.from(str, 'base64').toString('utf-8');
      } catch (e2) {
        return '';
      }
    }
  }

  // Helper function to strip HTML tags and decode entities
  function stripHtml(html) {
    if (!html) return '';
    
    // Remove script and style tags and their content
    html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Replace common HTML entities
    html = html.replace(/&nbsp;/g, ' ');
    html = html.replace(/&lt;/g, '<');
    html = html.replace(/&gt;/g, '>');
    html = html.replace(/&amp;/g, '&');
    html = html.replace(/&quot;/g, '"');
    html = html.replace(/&#39;/g, "'");
    html = html.replace(/&apos;/g, "'");
    html = html.replace(/&rdquo;/g, '"');
    html = html.replace(/&ldquo;/g, '"');
    html = html.replace(/&#8217;/g, "'");
    html = html.replace(/&#8211;/g, '–');
    html = html.replace(/&#8212;/g, '—');
    
    // Remove all HTML tags
    html = html.replace(/<[^>]*>/g, '');
    
    // Clean up multiple spaces and newlines
    html = html.replace(/\s+/g, ' ');
    html = html.replace(/\n\s*\n/g, '\n\n');
    
    return html.trim();
  }

  // Extract full email content with better handling
  function getBody(message) {
    let htmlBody = '';
    let plainBody = '';
    
    function extractFromPart(part) {
      if (!part) return;
      
      // Check if this part has body data
      if (part.body && part.body.data) {
        const text = decodeBase64(part.body.data);
        
        if (part.mimeType === 'text/plain' && !plainBody) {
          plainBody = text;
        } else if (part.mimeType === 'text/html' && !htmlBody) {
          htmlBody = text;
        }
      }
      
      // Recursively check nested parts
      if (part.parts && part.parts.length > 0) {
        for (const p of part.parts) {
          extractFromPart(p);
        }
      }
    }
    
    // Start extraction from payload
    if (message.payload) {
      extractFromPart(message.payload);
    }
    
    // Return both formatted HTML and plain text
    return {
      html: htmlBody || '',
      text: plainBody || '',
      isHtml: !!htmlBody
    };
  }

  const fullBody = getBody(message.data);
  const headers = message.data.payload.headers || [];
  const headerMap = {};
  headers.forEach(h => (headerMap[h.name] = h.value));

  return {
    id: message.data.id,
    from: headerMap['From'] || '',
    to: headerMap['To'] || '',
    subject: headerMap['Subject'] || '',
    date: headerMap['Date'] || '',
    snippet: message.data.snippet || '',
    body: fullBody.html || fullBody.text || '',
    bodyText: fullBody.text || stripHtml(fullBody.html) || message.data.snippet || '',
    isHtml: fullBody.isHtml,
    threadId: message.data.threadId
  };
}

router.get('/fetch', ensureAuthenticated, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '15', 10);
    const emails = await fetchEmailsFromGmail(req.session.tokens, limit);
    // Return to client; client may store in localStorage
    res.json({ ok: true, emails });
  } catch (err) {
    console.error('fetch error', err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

router.get('/content/:emailId', ensureAuthenticated, async (req, res) => {
  try {
    const { emailId } = req.params;
    const content = await fetchEmailContent(req.session.tokens, emailId);
    res.json({ ok: true, email: content });
  } catch (err) {
    console.error('fetch content error', err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

router.post('/classify', async (req, res) => {
  try {
    const { openaiKey, emails: providedEmails, limit } = req.body || {};

    let emails = providedEmails;
    if (!emails) {
      // try fetch from session if authenticated
      if (req.session && req.session.tokens) {
        emails = await fetchEmailsFromGmail(req.session.tokens, limit || 15);
      } else {
        return res.status(400).json({ error: 'No emails provided and not authenticated with Google.' });
      }
    }

    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: 'No emails to classify' });
    }

    const apiKey = openaiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(400).json({ error: 'OpenAI API key required (openaiKey in body or OPENAI_API_KEY in env)' });

    // Prepare prompt for OpenAI
    const emailsForPrompt = emails.map(e => ({ id: e.id, from: e.from, subject: e.subject, snippet: e.snippet }));

    // Use OpenAI API with GPT-4o
    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Valid models: gpt-4o, gpt-4-turbo, gpt-3.5-turbo
    let modelName = process.env.OPENAI_MODEL || 'gpt-4o';
    
    console.log('Attempting to use OpenAI model:', modelName);

    const systemPrompt = `You are an email classification assistant. Classify each email into one of these categories: Important, Promotions, Social, Marketing, Spam, General. Return ONLY a valid JSON array of objects with id, category, and reason fields.`;
    
    const userPrompt = `Classify these emails:\n${JSON.stringify(emailsForPrompt, null, 2)}`;

    console.log('Sending classification request to OpenAI');
    
    let text;
    try {
      const completion = await openai.chat.completions.create({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      });

      text = completion.choices[0].message.content;
      console.log('Classification successful');
    } catch (errOpenAI) {
      console.error('OpenAI API failed:', errOpenAI?.message || errOpenAI);
      
      return res.status(500).json({ 
        ok: false, 
        error: `OpenAI API error: ${errOpenAI?.message || errOpenAI}. Using model: ${modelName}`
      });
    }

    // try to extract JSON
    const jsonMatch = text.match(/\[\s*\{[\s\S]*?\}\s*,?\s*\]/s);
    let parsed;
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      // fallback: try full parse
      parsed = JSON.parse(text);
    }

    // Attach original email info for convenience
    const mapped = parsed.map(item => {
      const original = emailsForPrompt.find(e => String(e.id) === String(item.id)) || {};
      return { ...original, category: item.category, reason: item.reason };
    });

    res.json({ ok: true, classifications: mapped });
  } catch (err) {
    console.error('classification error', err);
    res.status(500).json({ ok: false, error: String(err), raw: err?.message });
  }
});

module.exports = router;
