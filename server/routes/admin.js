const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const db = require('../db/connection');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const { logAudit } = require('../utils/auditLogger');

// All endpoints in this file are restricted to authenticated admins
router.use(authMiddleware, adminMiddleware);

// Set up disk storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|gif|mp4|webm|ogg|mov|mkv/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype) || file.mimetype.startsWith('video/');
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images (jpeg, jpg, png, webp, gif) and videos (mp4, webm, ogg, mov, mkv) are allowed!'));
  }
});

// 1. GET /api/admin/stats → stats cards + chart details + recent donations
router.get('/stats', async (req, res) => {
  try {
    const [[{ totalCampaigns }]] = await db.query('SELECT COUNT(*) AS totalCampaigns FROM campaigns');
    const [[{ totalActiveCampaigns }]] = await db.query('SELECT COUNT(*) AS totalActiveCampaigns FROM campaigns WHERE status = "active"');
    const [[{ totalDonations, totalDonatedAmount }]] = await db.query(
      'SELECT COUNT(*) AS totalDonations, COALESCE(SUM(amount), 0) AS totalDonatedAmount FROM donations WHERE payment_status = "completed"'
    );
    const [[{ totalUsers }]] = await db.query('SELECT COUNT(*) AS totalUsers FROM users');

    const [monthlyAmounts] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%b') AS name, 
        COALESCE(SUM(amount), 0) AS amount 
      FROM donations 
      WHERE payment_status = 'completed' AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%b')
      ORDER BY DATE_FORMAT(created_at, '%Y-%m') ASC
    `);

    const [donorRegistrations] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%M %d') AS name, 
        COUNT(*) AS donors
      FROM users 
      WHERE role = 'donor' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d'), DATE_FORMAT(created_at, '%M %d')
      ORDER BY DATE_FORMAT(created_at, '%Y-%m-%d') ASC
    `);

    const [recentDonations] = await db.query(`
      SELECT 
        d.id,
        u.name AS donor_name,
        c.title AS campaign_title,
        d.amount,
        d.created_at AS date,
        d.payment_status AS status
      FROM donations d
      JOIN users u ON d.user_id = u.id
      JOIN campaigns c ON d.campaign_id = c.id
      ORDER BY d.created_at DESC
      LIMIT 5
    `);

    return res.status(200).json({
      stats: {
        totalCampaigns,
        totalActiveCampaigns,
        totalDonations,
        totalDonatedAmount: parseFloat(totalDonatedAmount),
        totalUsers,
      },
      charts: {
        monthlyAmounts: monthlyAmounts.length > 0 ? monthlyAmounts : [
          { name: 'Jan', amount: 4000 },
          { name: 'Feb', amount: 3000 },
          { name: 'Mar', amount: 5000 },
          { name: 'Apr', amount: 2780 },
          { name: 'May', amount: 1890 },
          { name: 'Jun', amount: 2390 },
        ],
        donorRegistrations: donorRegistrations.length > 0 ? donorRegistrations : [
          { name: 'Jun 01', donors: 10 },
          { name: 'Jun 05', donors: 15 },
          { name: 'Jun 10', donors: 25 },
          { name: 'Jun 15', donors: 30 },
          { name: 'Jun 18', donors: 42 },
        ],
      },
      recentDonations,
    });
  } catch (error) {
    console.error('Fetch admin stats details error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// 2. GET /api/admin/campaigns → get all campaigns
router.get('/campaigns', async (req, res) => {
  try {
    const [campaigns] = await db.query('SELECT * FROM campaigns ORDER BY created_at DESC');
    return res.status(200).json({ campaigns });
  } catch (error) {
    console.error('Admin fetch campaigns error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/admin/campaigns/:id → delete campaign
router.delete('/campaigns/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Select campaign title before deleting it
    const [campaigns] = await db.query('SELECT title FROM campaigns WHERE id = ?', [id]);
    const campaignTitle = campaigns.length > 0 ? campaigns[0].title : 'Unknown Campaign';

    const [result] = await db.query('DELETE FROM campaigns WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    await logAudit(req, 'Campaign CRUD', `Permanently deleted campaign "${campaignTitle}" (ID: ${id})`);

    return res.status(200).json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Admin delete campaign error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// 3. GET /api/admin/donations → full list with filters
router.get('/donations', async (req, res) => {
  const { campaign_id, start_date, end_date, status } = req.query;
  
  let query = `
    SELECT 
      d.id, 
      d.amount, 
      d.message, 
      d.payment_status AS status, 
      d.created_at AS date,
      d.stripe_payment_id,
      u.name AS donor_name,
      u.email AS donor_email,
      c.title AS campaign_title,
      r.receipt_number
    FROM donations d
    JOIN users u ON d.user_id = u.id
    JOIN campaigns c ON d.campaign_id = c.id
    LEFT JOIN receipts r ON r.donation_id = d.id
    WHERE 1=1
  `;
  const params = [];

  if (campaign_id) {
    query += ' AND d.campaign_id = ?';
    params.push(campaign_id);
  }

  if (status) {
    query += ' AND d.payment_status = ?';
    params.push(status);
  }

  if (start_date) {
    query += ' AND d.created_at >= ?';
    params.push(`${start_date} 00:00:00`);
  }

  if (end_date) {
    query += ' AND d.created_at <= ?';
    params.push(`${end_date} 23:59:59`);
  }

  query += ' ORDER BY d.created_at DESC';

  try {
    const [donations] = await db.query(query, params);
    return res.status(200).json({ donations });
  } catch (error) {
    console.error('Admin fetch donations list error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/admin/donations/:id → delete invalid/fake donation
router.delete('/donations/:id', async (req, res) => {
  const { id } = req.params;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Check if donation exists
    const [donations] = await conn.query('SELECT amount, campaign_id, user_id FROM donations WHERE id = ?', [id]);
    if (donations.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Donation not found' });
    }

    const { amount, campaign_id } = donations[0];
    const parsedAmount = parseFloat(amount);

    // 2. Subtract donation amount from campaign raised_amount
    await conn.query(
      'UPDATE campaigns SET raised_amount = GREATEST(0.00, raised_amount - ?) WHERE id = ?',
      [parsedAmount, campaign_id]
    );

    // 3. Delete donation (this will also delete the receipt via CASCADE)
    await conn.query('DELETE FROM donations WHERE id = ?', [id]);

    await conn.commit();

    // Log to audits
    await logAudit(req, 'Donation Void', `Deleted fake/invalid donation ID ${id} of value $${parsedAmount} (Campaign ID: ${campaign_id})`);

    return res.status(200).json({ message: 'Donation successfully deleted and campaign progress adjusted.' });
  } catch (error) {
    await conn.rollback();
    console.error('Admin delete donation error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    conn.release();
  }
});

// 4. GET /api/admin/users → get all users list
router.get('/users', async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
    return res.status(200).json({ users });
  } catch (error) {
    console.error('Admin fetch users error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// 5. PATCH /api/admin/users/:id/promote → promote user to admin
router.patch('/users/:id/promote', async (req, res) => {
  const { id } = req.params;
  try {
    const [users] = await db.query('SELECT name, email FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const user = users[0];

    const [result] = await db.query('UPDATE users SET role = "admin" WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    await logAudit(req, 'User Promotion', `Promoted user ${user.name} (${user.email}) to Administrator`);

    return res.status(200).json({ message: 'User successfully promoted to admin' });
  } catch (error) {
    console.error('Admin promote user error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// 6. POST /api/admin/users/create-admin → create a new admin directly
router.post('/users/create-admin', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, "admin")',
      [name, email, hashedPassword]
    );

    await logAudit(req, 'User Promotion', `Created direct admin account: ${name} (${email})`);

    return res.status(201).json({ message: 'Admin account created successfully!' });
  } catch (error) {
    console.error('Admin create admin account error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// 8. GET /api/admin/audit-logs → list all audit events with search & category filters
router.get('/audit-logs', async (req, res) => {
  const { category, search } = req.query;

  let query = `
    SELECT 
      a.id,
      a.user_id,
      a.user_email,
      a.action_category AS category,
      a.action_details AS details,
      a.ip_address,
      a.created_at AS date
    FROM audit_logs a
    WHERE 1=1
  `;
  const params = [];

  if (category) {
    query += ' AND a.action_category = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND (a.user_email LIKE ? OR a.action_details LIKE ? OR a.action_category LIKE ?)';
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  query += ' ORDER BY a.created_at DESC LIMIT 500';

  try {
    const [logs] = await db.query(query, params);
    return res.status(200).json({ logs });
  } catch (error) {
    console.error('Fetch audit logs error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// 7. POST /api/admin/upload → secure image and video upload endpoint
router.post('/upload', (req, res) => {
  const uploadSingle = upload.single('image');
  uploadSingle(req, res, function (err) {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host');
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    return res.status(200).json({ imageUrl: fileUrl, url: fileUrl });
  });
});

module.exports = router;
