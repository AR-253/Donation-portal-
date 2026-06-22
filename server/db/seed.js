const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const CAMPAIGNS = [
  {
    title: 'Clean Water Initiative',
    description: 'We are building clean water wells and filter stations in remote drylands to provide safe, drinkable water to hundreds of families, reducing water-borne diseases.',
    goal_amount: 8000.00,
    raised_amount: 3250.00,
    image_url: 'https://images.unsplash.com/photo-1541944743827-e04aa6427c33?w=800',
    status: 'active',
  },
  {
    title: 'Education For All Kids',
    description: 'Sponsor uniforms, school books, backpacks, and term tuition fees for underprivileged orphans and street children, unlocking a brighter future through education.',
    goal_amount: 15000.00,
    raised_amount: 11200.00,
    image_url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
    status: 'active',
  },
  {
    title: 'Emergency Medical Care Kit',
    description: 'Providing primary health kits, emergency surgical resources, and life-saving medicines to local clinics handling remote disasters and critical care cases.',
    goal_amount: 6000.00,
    raised_amount: 4500.00,
    image_url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800',
    status: 'active',
  },
  {
    title: 'Feed Hungry Families',
    description: 'Distributing warm, nutritious meal packets and monthly grocery packs to low-income daily-wage worker households impacted by economic challenges.',
    goal_amount: 5000.00,
    raised_amount: 1250.00,
    image_url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800',
    status: 'active',
  },
  {
    title: 'Solar Power Grid Setup',
    description: 'Installing solar microgrids in rural community school buildings and medical centers to guarantee uninterrupted power supply for light and equipment.',
    goal_amount: 12000.00,
    raised_amount: 0.00,
    image_url: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800',
    status: 'active',
  }
];

async function seedDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'givehope_db';

  console.log('Starting GiveHope database seeding process...');

  let conn;
  try {
    conn = await mysql.createConnection({
      host,
      user,
      password,
      database: dbName,
    });
  } catch (error) {
    console.error('Failed to connect to database for seeding:', error.message);
    process.exit(1);
  }

  try {
    // 1. Create default admin if not exists
    const [existingAdmins] = await conn.query('SELECT id FROM users WHERE email = ?', ['admin@givehope.org']);
    let adminId;

    if (existingAdmins.length === 0) {
      console.log('Creating default administrator account...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const [insertResult] = await conn.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        ['GiveHope Admin', 'admin@givehope.org', hashedPassword, 'admin']
      );
      adminId = insertResult.insertId;
      console.log('Default administrator created (admin@givehope.org / admin123).');
    } else {
      adminId = existingAdmins[0].id;
      console.log('Administrator account already exists.');
    }

    // 2. Clear old campaigns (optional, but keep it clean)
    console.log('Cleaning existing campaigns to reload fresh seed data...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 0;');
    await conn.query('TRUNCATE TABLE receipts;');
    await conn.query('TRUNCATE TABLE donations;');
    await conn.query('TRUNCATE TABLE campaigns;');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1;');

    // 3. Seed Campaigns
    console.log(`Inserting ${CAMPAIGNS.length} default campaigns...`);
    for (const campaign of CAMPAIGNS) {
      await conn.query(
        'INSERT INTO campaigns (title, description, goal_amount, raised_amount, image_url, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [campaign.title, campaign.description, campaign.goal_amount, campaign.raised_amount, campaign.image_url, campaign.status, adminId]
      );
    }
    console.log('Campaigns seeding completed.');

    // 4. Retrieve seeded campaign IDs to associate dummy donations
    const [insertedCampaigns] = await conn.query('SELECT id, title FROM campaigns');
    
    // Create a donor user to simulate donations
    const [existingDonors] = await conn.query('SELECT id FROM users WHERE email = ?', ['donor@givehope.org']);
    let donorId;
    if (existingDonors.length === 0) {
      const donorPass = await bcrypt.hash('donor123', 10);
      const [donorInsert] = await conn.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        ['John Donor', 'donor@givehope.org', donorPass, 'donor']
      );
      donorId = donorInsert.insertId;
    } else {
      donorId = existingDonors[0].id;
    }

    // Insert dummy donation logs to make analytics load statistics out of the box
    console.log('Generating sample donation logs and receipt records...');
    const donationSamples = [
      { user_id: donorId, campaign_id: insertedCampaigns[0].id, amount: 250, message: 'Clean water is a basic human right!', status: 'completed' },
      { user_id: donorId, campaign_id: insertedCampaigns[0].id, amount: 1000, message: 'Supporting clean water!', status: 'completed' },
      { user_id: donorId, campaign_id: insertedCampaigns[1].id, amount: 500, message: 'All the best to the kids.', status: 'completed' },
      { user_id: donorId, campaign_id: insertedCampaigns[1].id, amount: 150, message: 'Keep up the great work.', status: 'completed' },
      { user_id: donorId, campaign_id: insertedCampaigns[2].id, amount: 300, message: 'Happy to support health clinics.', status: 'completed' },
    ];

    for (let i = 0; i < donationSamples.length; i++) {
      const sample = donationSamples[i];
      // Generate back-dated timestamps for last 3 months to populate the BarChart correctly
      const monthsAgo = i % 3; 
      const mockDate = new Date();
      mockDate.setMonth(mockDate.getMonth() - monthsAgo);

      const [donationRes] = await conn.query(
        'INSERT INTO donations (user_id, campaign_id, amount, message, payment_status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [sample.user_id, sample.campaign_id, sample.amount, sample.message, sample.status, mockDate]
      );
      const donationId = donationRes.insertId;

      const receiptNumber = `GH-${Date.now()}-${1000 + i}`;
      await conn.query(
        'INSERT INTO receipts (donation_id, email_sent_at, receipt_number) VALUES (?, ?, ?)',
        [donationId, new Date(), receiptNumber]
      );
    }

    console.log('\n==================================================');
    console.log('🟢 Seeding successfully completed! 🟢');
    console.log('Default credentials loaded:');
    console.log('- Admin: admin@givehope.org / admin123');
    console.log('- Donor: donor@givehope.org / donor123');
    console.log('==================================================');

  } catch (err) {
    console.error('Seeding process failed:', err.message);
  } finally {
    await conn.end();
  }
}

seedDatabase();
