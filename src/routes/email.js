const express = require('express');
const router = express.Router();
const gmailService = require('../services/gmailService');
const classificationService = require('../services/classificationService');

/**
 * Middleware to ensure user is authenticated with Google
 */
function ensureAuthenticated(req, res, next) {
  if (req.session && req.session.tokens) return next();
  return res.status(401).json({ error: 'Not authenticated with Google' });
}

/**
 * GET /api/emails/fetch
 * Fetch emails from user's Gmail
 */
router.get('/fetch', ensureAuthenticated, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '15', 10);
    const emails = await gmailService.fetchEmails(req.session.tokens, limit);
    res.json({ ok: true, emails });
  } catch (err) {
    console.error('fetch error', err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

/**
 * GET /api/emails/content/:emailId
 * Fetch full content of a specific email
 */
router.get('/content/:emailId', ensureAuthenticated, async (req, res) => {
  try {
    const { emailId } = req.params;
    const content = await gmailService.fetchEmailContent(req.session.tokens, emailId);
    res.json({ ok: true, email: content });
  } catch (err) {
    console.error('fetch content error', err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

/**
 * POST /api/emails/classify
 * Classify emails using OpenAI
 */
router.post('/classify', async (req, res) => {
  try {
    const { openaiKey, emails: providedEmails, limit } = req.body || {};

    // Get emails from request or fetch from Gmail
    let emails = providedEmails;
    if (!emails && req.session?.tokens) {
      emails = await gmailService.fetchEmails(req.session.tokens, limit || 15);
    }

    // Validate emails
    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ 
        error: 'No emails to classify' 
      });
    }

    // Get API key from request or environment
    const apiKey = openaiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ 
        error: 'OpenAI API key required (openaiKey in body or OPENAI_API_KEY in env)' 
      });
    }

    // Classify emails
    const classifications = await classificationService.classifyEmails(apiKey, emails);
    res.json({ ok: true, classifications });
  } catch (err) {
    console.error('classification error', err);
    res.status(500).json({ 
      ok: false, 
      error: String(err) 
    });
  }
});

module.exports = router;
