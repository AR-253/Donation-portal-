const nodemailer = require('nodemailer');
require('dotenv').config();

// Create Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
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
    from: `"GiveHope" <${process.env.EMAIL_USER || 'noreply@givehope.org'}>`,
    to: email,
    subject: `Thank you for your donation to GiveHope! (Receipt #${receiptNumber})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e5e7eb; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <div style="text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 15px; margin-bottom: 20px;">
          <span style="font-size: 28px; font-weight: 900; color: #059669; letter-spacing: -1px;">GiveHope</span>
        </div>
        
        <h2 style="color: #059669; margin-top: 0; text-align: center;">Donation Receipt</h2>
        
        <p>Dear <strong>${name}</strong>,</p>
        <p>Thank you so much for your support! We are deeply grateful for your generous donation to the <strong>${campaignTitle}</strong> campaign. Your contribution is making a direct impact and bringing hope where it is needed most.</p>
        
        <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 12px; padding: 20px; margin: 25px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 0; color: #6b7280;">Receipt Number:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #111827;">${receiptNumber}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 0; color: #6b7280;">Campaign:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #111827;">${campaignTitle}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 0; color: #6b7280;">Amount:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 800; color: #059669; font-size: 16px;">$${amount.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b7280;">Date:</td>
              <td style="padding: 10px 0; text-align: right; color: #111827;">${new Date().toLocaleDateString()}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 13px; color: #4b5563; line-height: 1.5;">
          A record of this donation has been saved in your dashboard history. If you did not make this payment or believe there is an error, please reach out to us at <a href="mailto:support@givehope.org" style="color: #059669; text-decoration: underline;">support@givehope.org</a>.
        </p>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 25px; text-align: center; font-size: 11px; color: #9ca3af;">
          <p>&copy; ${new Date().getFullYear()} GiveHope Donation Portal. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    // Graceful fallback if environment variables are not configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log(`[EMAIL SIMULATION] Gmail SMTP is not configured. Logging receipt details:`);
      console.log(`To: ${email}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`Receipt Number: ${receiptNumber}`);
      console.log(`Campaign: ${campaignTitle}`);
      console.log(`Amount: $${amount}`);
      return true;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('Receipt email sent via Gmail SMTP: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send receipt email via Gmail SMTP:', error.message);
    return false;
  }
};

module.exports = { sendReceipt };
