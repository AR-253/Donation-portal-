const db = require('../db/connection');
const { logAudit } = require('../utils/auditLogger');

// GET /api/campaigns → get all active campaigns (with raised_amount percentage)
exports.getAllCampaigns = async (req, res) => {
  try {
    const query = `
      SELECT 
        id, 
        title, 
        description, 
        goal_amount, 
        raised_amount, 
        image_url, 
        status, 
        created_by, 
        created_at,
        COALESCE(ROUND((raised_amount / goal_amount) * 100, 2), 0) AS raised_percentage
      FROM campaigns 
      WHERE status = 'active' 
      ORDER BY created_at DESC
    `;
    const [campaigns] = await db.query(query);
    return res.status(200).json({ campaigns });
  } catch (error) {
    console.error('Fetch active campaigns error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/campaigns/:id → single campaign with recent donations list
exports.getCampaignById = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Fetch campaign details
    const campaignQuery = `
      SELECT 
        id, 
        title, 
        description, 
        goal_amount, 
        raised_amount, 
        image_url, 
        status, 
        created_by, 
        created_at,
        COALESCE(ROUND((raised_amount / goal_amount) * 100, 2), 0) AS raised_percentage
      FROM campaigns 
      WHERE id = ?
    `;
    const [campaigns] = await db.query(campaignQuery, [id]);

    if (campaigns.length === 0) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const campaign = campaigns[0];

    // 2. Fetch recent donations for this campaign (with donor's name)
    const donationsQuery = `
      SELECT 
        d.id, 
        d.amount, 
        d.message, 
        d.created_at, 
        u.name AS donor_name 
      FROM donations d 
      JOIN users u ON d.user_id = u.id 
      WHERE d.campaign_id = ? AND d.payment_status = 'completed' 
      ORDER BY d.created_at DESC 
      LIMIT 5
    `;
    const [recentDonations] = await db.query(donationsQuery, [id]);

    return res.status(200).json({ campaign, recentDonations });
  } catch (error) {
    console.error('Fetch campaign detail error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/campaigns → admin only, create new campaign
exports.createCampaign = async (req, res) => {
  const { title, description, goal_amount, image_url } = req.body;
  const created_by = req.user.id;

  try {
    if (!title || !description || !goal_amount) {
      return res.status(400).json({ message: 'Title, description and goal amount are required' });
    }

    const [result] = await db.query(
      'INSERT INTO campaigns (title, description, goal_amount, raised_amount, image_url, status, created_by) VALUES (?, ?, ?, 0.00, ?, \'active\', ?)',
      [title, description, parseFloat(goal_amount), image_url || '', created_by]
    );

    await logAudit(req, 'Campaign CRUD', `Created new campaign: "${title}" (Goal: $${parseFloat(goal_amount).toLocaleString()}, ID: ${result.insertId})`);

    return res.status(201).json({
      message: 'Campaign created successfully',
      campaignId: result.insertId,
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// PUT /api/campaigns/:id → admin only, update campaign
exports.updateCampaign = async (req, res) => {
  const { id } = req.params;
  const { title, description, goal_amount, image_url, status } = req.body;

  try {
    if (!title || !description || !goal_amount || !status) {
      return res.status(400).json({ message: 'Title, description, goal amount, and status are required' });
    }

    // Check if campaign exists
    const [existing] = await db.query('SELECT id FROM campaigns WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    await db.query(
      'UPDATE campaigns SET title = ?, description = ?, goal_amount = ?, image_url = ?, status = ? WHERE id = ?',
      [title, description, parseFloat(goal_amount), image_url || '', status, id]
    );

    await logAudit(req, 'Campaign CRUD', `Updated campaign "${title}" (ID: ${id}, Status: ${status}, Goal: $${parseFloat(goal_amount).toLocaleString()})`);

    return res.status(200).json({ message: 'Campaign updated successfully' });
  } catch (error) {
    console.error('Update campaign error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// PATCH /api/campaigns/:id/status → admin only, change status
exports.changeStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    if (!status) {
      return res.status(400).json({ message: 'Status field is required' });
    }

    // Verify valid status enum
    const validStatuses = ['active', 'completed', 'paused'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value. Must be active, completed, or paused.' });
    }

    // Check if campaign exists
    const [existing] = await db.query('SELECT id FROM campaigns WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    await db.query('UPDATE campaigns SET status = ? WHERE id = ?', [status, id]);

    await logAudit(req, 'Campaign CRUD', `Changed status of campaign ID ${id} to "${status}"`);

    return res.status(200).json({ message: `Campaign status updated to ${status} successfully` });
  } catch (error) {
    console.error('Patch campaign status error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
