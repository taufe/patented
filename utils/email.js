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

const assertEmailConfigured = () => {
  if (!isEmailConfigured()) {
    throw new Error('SMTP is not configured. Password reset emails cannot be sent.');
  }
};

const sendViaHttpProvider = async ({ email, subject, text, html }) => {
  const host = getSmtpHost().toLowerCase();
  const apiKey = getSmtpPass();
  const from = getSmtpFrom();

  if (host.includes('resend')) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject,
        text,
        html,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Resend email send failed (${response.status}): ${body}`);
    }

    return true;
  }

  if (host.includes('sendgrid')) {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: { email: from.replace(/^.*<|>.*$/g, '') || from },
        personalizations: [{ to: [{ email }] }],
        subject,
        content: [
          { type: 'text/plain', value: text },
          { type: 'text/html', value: html },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`SendGrid email send failed (${response.status}): ${body}`);
    }

    return true;
  }

  return false;
};

const getTransporter = () => {
  assertEmailConfigured();

  if (!transporter) {
    const host = getSmtpHost();
    const port = getSmtpPort();
    const isGmail = /gmail\.com$/i.test(host);

    transporter = nodemailer.createTransport(
      isGmail
        ? {
            service: 'gmail',
            auth: {
              user: getSmtpUser(),
              pass: getSmtpPass(),
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
          }
        : {
            host,
            port,
            secure: port === 465,
            requireTLS: port === 587,
            auth: {
              user: getSmtpUser(),
              pass: getSmtpPass(),
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
          }
    );
  }

  return transporter;
};

const sendPasswordResetCode = async ({ email, code }) => {
  assertEmailConfigured();

  const subject = 'Your password reset verification code';
  const text = `Your verification code is: ${code}\n\nThis code expires in 10 minutes. If you did not request a password reset, you can ignore this email.`;
  const html = `
    <p>Your verification code is:</p>
    <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</p>
    <p>This code expires in 10 minutes.</p>
    <p>If you did not request a password reset, you can ignore this email.</p>
  `;

  const sentViaHttp = await sendViaHttpProvider({ email, subject, text, html });

  if (sentViaHttp) {
    console.log(`[password-reset] HTTP email accepted for ${email}`);
    return;
  }

  const info = await getTransporter().sendMail({
    from: getSmtpFrom(),
    to: email,
    subject,
    text,
    html,
  });

  if (!info || (!info.messageId && !info.accepted?.length)) {
    throw new Error('SMTP accepted no recipients for the password reset email');
  }

  console.log(`[password-reset] SMTP email accepted for ${email} messageId=${info.messageId || 'none'}`);
};

module.exports = {
  sendPasswordResetCode,
};
