const db = require('../db/connection');
const { sendReceipt } = require('../utils/sendReceipt');

// POST /api/donations → authenticated users only
exports.createDonation = async (req, res) => {
  const { campaign_id, amount, message, stripe_payment_id } = req.body;
  const user_id = req.user.id;
  const user_email = req.user.email;
  const user_name = req.user.name;

  // 1. Validate amount > 0
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ message: 'Donation amount must be greater than 0' });
  }

  if (!campaign_id) {
    return res.status(400).json({ message: 'Campaign ID is required' });
  }

  const conn = await db.getConnection();
  try {
    // Start transaction
    await conn.beginTransaction();

    // 2. Verify campaign exists and is active
    const [campaigns] = await conn.query(
      'SELECT id, title, status FROM campaigns WHERE id = ? FOR UPDATE',
      [campaign_id]
    );

    if (campaigns.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const campaign = campaigns[0];
    if (campaign.status !== 'active') {
      await conn.rollback();
      return res.status(400).json({ message: `Campaign is currently not active (Status: ${campaign.status})` });
    }

    // 3. Insert donation record
    const paymentStatus = 'completed'; // basic simulation completes payment
    const donationQuery = `
      INSERT INTO donations (user_id, campaign_id, amount, message, payment_status, stripe_payment_id) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [donationResult] = await conn.query(donationQuery, [
      user_id,
      campaign_id,
      parsedAmount,
      message || '',
      paymentStatus,
      stripe_payment_id || null,
    ]);

    const donationId = donationResult.insertId;

    // 4. Update campaign raised_amount
    await conn.query(
      'UPDATE campaigns SET raised_amount = raised_amount + ? WHERE id = ?',
      [parsedAmount, campaign_id]
    );

    // Commit database updates
    await conn.commit();

    // 5. Generate and trigger receipt (non-blocking for response, but record receipt in DB)
    const receiptNumber = `GH-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Call the receipt sender utility
    const emailSent = await sendReceipt(user_email, user_name, campaign.title, parsedAmount, receiptNumber);
    const emailSentAt = emailSent ? new Date() : null;

    // Save receipt log to the database
    await db.query(
      'INSERT INTO receipts (donation_id, email_sent_at, receipt_number) VALUES (?, ?, ?)',
      [donationId, emailSentAt, receiptNumber]
    );

    // 6. Return success details
    return res.status(201).json({
      message: 'Donation processed successfully',
      donation: {
        id: donationId,
        campaign_id,
        campaign_title: campaign.title,
        amount: parsedAmount,
        message: message || '',
        payment_status: paymentStatus,
        receipt_number: receiptNumber,
        created_at: new Date(),
      },
    });
  } catch (error) {
    await conn.rollback();
    console.error('Create donation error:', error);
    return res.status(500).json({ message: 'Server error processing donation' });
  } finally {
    conn.release();
  }
};

// GET /api/donations/my → get logged-in user's donation history
exports.getMyDonations = async (req, res) => {
  const user_id = req.user.id;

  try {
    const query = `
      SELECT 
        d.id, 
        d.campaign_id, 
        d.amount, 
        d.message, 
        d.payment_status, 
        d.stripe_payment_id, 
        d.created_at,
        c.title AS campaign_title,
        r.receipt_number
      FROM donations d
      JOIN campaigns c ON d.campaign_id = c.id
      LEFT JOIN receipts r ON r.donation_id = d.id
      WHERE d.user_id = ?
      ORDER BY d.created_at DESC
    `;
    const [donations] = await db.query(query, [user_id]);
    return res.status(200).json({ donations });
  } catch (error) {
    console.error('Fetch my donations error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/donations/campaign/:id → get all donations for a campaign (admin only)
exports.getCampaignDonations = async (req, res) => {
  const campaign_id = req.params.id;

  try {
    const query = `
      SELECT 
        d.id, 
        d.amount, 
        d.message, 
        d.payment_status, 
        d.stripe_payment_id, 
        d.created_at,
        u.name AS donor_name,
        u.email AS donor_email,
        r.receipt_number
      FROM donations d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN receipts r ON r.donation_id = d.id
      WHERE d.campaign_id = ?
      ORDER BY d.created_at DESC
    `;
    const [donations] = await db.query(query, [campaign_id]);
    return res.status(200).json({ donations });
  } catch (error) {
    console.error('Fetch campaign donations error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
