const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const campaignRoutes = require('./routes/campaigns');
const donationRoutes = require('./routes/donations');
const adminRoutes = require('./routes/admin');
const storyRoutes = require('./routes/stories');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Helmet Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 2. Strict CORS Configuration (allows CLIENT_URL only)
const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
  origin: clientOrigin,
  optionsSuccessStatus: 200,
  credentials: true,
}));

const path = require('path');

// 3. Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 4. Rate Limiter for Authentication Routes (100 requests per 15 minutes for development testing)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // relaxed for development testing
  message: { message: 'Too many auth requests from this IP. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Routes
app.use('/api/auth', authLimiter, authRoutes); // Apply rate limiter to auth endpoints
app.use('/api/campaigns', campaignRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stories', storyRoutes);

// Base route for server health check
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the GiveHope Donation Management API' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong on the server' });
});

// Start listening
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`CORS is configured to accept origins from: ${clientOrigin}`);
  });
}

module.exports = app;
