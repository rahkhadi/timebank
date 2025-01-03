const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const next = require('next');
const mongoose = require('mongoose');
const authMiddleware = require('./src/utils/authMiddleware').default;

// Middleware for parsing request bodies
const app = express();
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

// Connect to MongoDB
const connectDB = require('./src/utils/dbConnect');
connectDB();

const PORT = process.env.PORT || 3000;

nextApp.prepare().then(() => {
  const server = express();

  // Middleware for parsing request bodies
  server.use(bodyParser.json());
  server.use(bodyParser.urlencoded({ extended: true }));

  // Set up session management
  server.use(session({
    secret: process.env.SESSION_SECRET || '0dca6b0b5e48d58e46766e10a3225fb9f9a1723fcb68026c37d91f1203799d41',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: !dev } // Secure cookies in production
  }));

  // Middleware to expose session user data to all routes
  server.use((req, res, next) => {
    res.locals.user = req.session.user;
    next();
  });

  // Define routes for API endpoints with auth middleware
  server.use('/api/auth/signup', require('./pages/api/auth/signup').default);
  server.use('/api/contact', authMiddleware, require('./pages/api/contact').default);

  // Handle all other requests through Next.js
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});