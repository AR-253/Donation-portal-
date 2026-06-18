const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const storyController = require('../controllers/storyController');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// Inline optional auth middleware for public comments
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      req.user = decoded;
    } catch (error) {
      // If token is expired or invalid, we treat it as guest request
      console.warn('Optional JWT Verification failed:', error.message);
    }
  }
  next();
};

// Public Endpoints
router.get('/', storyController.getAllStories);
router.post('/:id/like', storyController.likeStory);
router.post('/:id/comments', optionalAuth, storyController.addComment);

// Admin-Only Endpoints (Requires valid login and admin role)
router.post('/', authMiddleware, adminMiddleware, storyController.createStory);
router.put('/:id', authMiddleware, adminMiddleware, storyController.updateStory);
router.delete('/:id', authMiddleware, adminMiddleware, storyController.deleteStory);
router.delete('/comments/:id', authMiddleware, adminMiddleware, storyController.deleteComment);

module.exports = router;
