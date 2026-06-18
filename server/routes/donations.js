const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// All donation endpoints require user authentication
router.use(authMiddleware);

// POST /api/donations → authenticated users only
router.post('/', donationController.createDonation);

// GET /api/donations/my → get logged-in user's donation history
router.get('/my', donationController.getMyDonations);

// GET /api/donations/campaign/:id → get all donations for a campaign (admin only)
router.get('/campaign/:id', adminMiddleware, donationController.getCampaignDonations);

module.exports = router;
