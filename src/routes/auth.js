const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { google } = require('googleapis');

const router = express.Router();

const CLIENT_ROOT_URL = process.env.CLIENT_ROOT_URL || 'http://localhost:3000';

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// configure Google strategy only if credentials are present
const googleConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
if (googleConfigured) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || `${process.env.SERVER_ROOT_URL || 'http://localhost:4000'}/auth/google/callback`,
      },
      function (accessToken, refreshToken, profile, cb) {
        // Attach tokens to profile for session storage
        profile._tokens = { accessToken, refreshToken };
        return cb(null, profile);
      }
    )
  );
} else {
  console.warn('Google OAuth not configured (GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET missing). Auth routes that depend on Google will be disabled.');
}

// start OAuth flow
router.get('/google', (req, res, next) => {
  if (!googleConfigured) return res.status(500).json({ error: 'Google OAuth is not configured on the server.' });
  return passport.authenticate('google', {
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/gmail.readonly'],
    accessType: 'offline',
    prompt: 'consent',
  })(req, res, next);
});

// callback
router.get('/google/callback', (req, res, next) => {
  if (!googleConfigured) return res.status(500).json({ error: 'Google OAuth is not configured on the server.' });
  const failureUrl = `${CLIENT_ROOT_URL}/auth/failure`;
  return passport.authenticate('google', { failureRedirect: failureUrl, session: true })(req, res, next);
}, (req, res) => {
  // Save tokens to session (passport stored profile with tokens)
  if (req.user && req.user._tokens) {
    req.session.tokens = req.user._tokens;
  }
  // Redirect to frontend - frontend should handle the rest
  const redirectTo = `${CLIENT_ROOT_URL}/auth/success`;
  res.redirect(redirectTo);
});

router.get('/failure', (req, res) => {
  // Redirect to frontend failure page instead of returning JSON
  const redirectTo = `${CLIENT_ROOT_URL}/auth/failure`;
  res.redirect(redirectTo);
});

router.get('/status', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    res.json({ authenticated: true, user: req.user && { id: req.user.id, displayName: req.user.displayName, emails: req.user.emails } });
  } else {
    res.json({ authenticated: false });
  }
});

router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Passport logout error:', err);
    }
    
    if (req.session) {
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error('Session destroy error:', destroyErr);
          return res.status(500).json({ ok: false, error: destroyErr.message });
        }
        res.clearCookie('connect.sid', { path: '/' });
        res.json({ ok: true });
      });
    } else {
      res.json({ ok: true });
    }
  });
});

module.exports = router;
