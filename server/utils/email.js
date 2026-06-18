const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || null, // placeholder if not defined
    pass: process.env.SMTP_PASS || null,
  },
});

/**
 * Sends a donation receipt email to the donor.
 * @param {string} email - Donor's email address
 * @param {string} name - Donor's name
 * @param {string} campaignTitle - Campaign title
 * @param {number} amount - Donation amount
 * @param {string} receiptNumber - Generated receipt number
 */
const sendReceipt = async (email, name, campaignTitle, amount, receiptNumber) => {
  const mailOptions = {
    from: `"GiveHope" <${process.env.SMTP_FROM || 'noreply@givehope.org'}>`,
    to: email,
    subject: `Thank you for your donation to GiveHope! (Receipt #${receiptNumber})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #059669; text-align: center;">Thank You for Giving Hope!</h2>
        <p>Dear <strong>${name}</strong>,</p>
        <p>We are deeply grateful for your generous donation to the <strong>${campaignTitle}</strong> campaign. Your contribution plays a critical role in bringing hope to those who need it most.</p>
        
        <div style="background-color: #f9fafb; border-radius: 6px; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; color: #374151;">Donation Receipt</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px 0; color: #6b7280;">Receipt Number:</td>
              <td style="padding: 5px 0; text-align: right; font-weight: bold;">${receiptNumber}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #6b7280;">Campaign:</td>
              <td style="padding: 5px 0; text-align: right;">${campaignTitle}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #6b7280;">Amount:</td>
              <td style="padding: 5px 0; text-align: right; font-weight: bold; color: #059669;">$${amount.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #6b7280;">Date:</td>
              <td style="padding: 5px 0; text-align: right;">${new Date().toLocaleDateString()}</td>
            </tr>
          </table>
        </div>

        <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px;">
          This is an automated receipt for your donation. If you have any questions, please contact our support team.
        </p>
      </div>
    `,
  };

  try {
    // If SMTP details are missing, log and return to simulate success
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(`[EMAIL SIMULATION] Ethereal/Local SMTP is not configured. Logging receipt details:`);
      console.log(`To: ${email}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`Receipt Number: ${receiptNumber}`);
      console.log(`Campaign: ${campaignTitle}`);
      console.log(`Amount: $${amount}`);
      return true;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('Receipt email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send receipt email:', error.message);
    return false; // don't crash the transaction or request, just report failure
  }
};

module.exports = { sendReceipt };
