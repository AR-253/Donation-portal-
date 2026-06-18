const db = require('../db/connection');

/**
 * Reusable utility to log administrative and security actions to the database
 * @param {Object} req - The Express request object to extract user, email, and IP address
 * @param {string} category - Category of the action ('Campaign CRUD', 'User Promotion', 'Auth', 'System')
 * @param {string} details - Detailed explanation of the action performed
 */
async function logAudit(req, category, details) {
  try {
    const userId = req?.user?.id || null;
    // Fallback to body email if user is not fully authenticated yet (e.g. login attempts)
    const userEmail = req?.user?.email || req?.body?.email || null;
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.ip || req.socket?.remoteAddress || null) : null;

    await db.query(
      'INSERT INTO audit_logs (user_id, user_email, action_category, action_details, ip_address) VALUES (?, ?, ?, ?, ?)',
      [userId, userEmail, category, details, ipAddress]
    );
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

module.exports = { logAudit };
