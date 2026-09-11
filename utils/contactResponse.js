const { isValidEmail } = require('./validation');

const toPublicContact = (contact) => ({
  whatsapp: contact.whatsapp || '',
  phone: contact.phone || '',
  email: contact.email || '',
});

const applyContactUpdates = (contact, body = {}) => {
  if (body.whatsapp !== undefined) {
    const whatsapp = String(body.whatsapp).trim();

    if (!whatsapp) {
      const error = new Error('WhatsApp number cannot be empty');
      error.statusCode = 400;
      throw error;
    }

    contact.whatsapp = whatsapp;
  }

  if (body.phone !== undefined) {
    contact.phone = String(body.phone).trim();
  }

  if (body.email !== undefined) {
    const email = String(body.email).trim();

    if (!email) {
      const error = new Error('Email cannot be empty');
      error.statusCode = 400;
      throw error;
    }

    if (!isValidEmail(email)) {
      const error = new Error('Please provide a valid email address');
      error.statusCode = 400;
      throw error;
    }

    contact.email = email;
  }

  return contact;
};

module.exports = {
  toPublicContact,
  applyContactUpdates,
};
