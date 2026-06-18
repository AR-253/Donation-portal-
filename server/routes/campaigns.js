const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// Public endpoints
router.get('/', campaignController.getAllCampaigns);
router.get('/:id', campaignController.getCampaignById);

// Admin-only endpoints (requires valid login and admin role)
router.post('/', authMiddleware, adminMiddleware, campaignController.createCampaign);
router.put('/:id', authMiddleware, adminMiddleware, campaignController.updateCampaign);
router.patch('/:id/status', authMiddleware, adminMiddleware, campaignController.changeStatus);

module.exports = router;
