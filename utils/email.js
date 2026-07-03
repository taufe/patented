const nodemailer = require('nodemailer');
const {
  getSmtpHost,
  getSmtpPort,
  getSmtpUser,
  getSmtpPass,
  getSmtpFrom,
  isEmailConfigured,
} = require('../config/env');

let transporter;

const getTransporter = () => {
  if (!isEmailConfigured()) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: getSmtpHost(),
      port: getSmtpPort(),
      secure: getSmtpPort() === 465,
      auth: {
        user: getSmtpUser(),
        pass: getSmtpPass(),
      },
    });
  }

  return transporter;
};

const sendPasswordResetCode = async ({ email, code }) => {
  const subject = 'Your password reset verification code';
  const text = `Your verification code is: ${code}\n\nThis code expires in 10 minutes. If you did not request a password reset, you can ignore this email.`;
  const html = `
    <p>Your verification code is:</p>
    <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</p>
    <p>This code expires in 10 minutes.</p>
    <p>If you did not request a password reset, you can ignore this email.</p>
  `;

  const mailTransporter = getTransporter();

  if (!mailTransporter) {
    console.log(`[password-reset] SMTP not configured. Verification code for ${email}: ${code}`);
    return;
  }

  await mailTransporter.sendMail({
    from: getSmtpFrom(),
    to: email,
    subject,
    text,
    html,
  });
};

module.exports = {
  sendPasswordResetCode,
};
