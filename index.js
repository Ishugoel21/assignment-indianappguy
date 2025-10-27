require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const authRouter = require('./src/routes/auth');
const emailsRouter = require('./src/routes/email');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.CLIENT_ROOT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

const FileStore = require('session-file-store')(session);

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'change-me',
    resave: false,
    saveUninitialized: false,
    store: new FileStore({
      path: './sessions',
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      retries: 0
    }),
    cookie: { 
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// mount routers
app.use('/auth', authRouter);
app.use('/api/emails', emailsRouter);

app.get('/', (req, res) => {
  res.json({ ok: true, message: 'Gmail classifier backend is running' });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
