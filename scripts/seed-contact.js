#!/usr/bin/env node

require('dotenv').config();

const Contact = require('../models/Contact');
const connectDB = require('../config/db');

const { DEFAULT_CONTACT, SITE_KEY } = Contact;

const seed = async () => {
  await connectDB();

  const contact = await Contact.findOneAndUpdate(
    { key: SITE_KEY },
    {
      $setOnInsert: {
        key: SITE_KEY,
        ...DEFAULT_CONTACT,
      },
    },
    { returnDocument: 'after', upsert: true }
  );

  console.log('Contact settings:', {
    whatsapp: contact.whatsapp,
    phone: contact.phone,
    email: contact.email,
  });

  process.exit(0);
};

seed().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
