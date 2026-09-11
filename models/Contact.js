const mongoose = require('mongoose');

const SITE_KEY = 'site';

const DEFAULT_CONTACT = {
  whatsapp: '03159464767',
  phone: '03159464767',
  email: 'Sajidkhan56564@gmail.com',
};

const contactSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: SITE_KEY,
      unique: true,
      trim: true,
    },
    whatsapp: {
      type: String,
      default: DEFAULT_CONTACT.whatsapp,
      trim: true,
    },
    phone: {
      type: String,
      default: DEFAULT_CONTACT.phone,
      trim: true,
    },
    email: {
      type: String,
      default: DEFAULT_CONTACT.email,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

contactSchema.statics.getOrCreate = async function getOrCreate() {
  const existing = await this.findOne({ key: SITE_KEY });

  if (existing) {
    return existing;
  }

  try {
    return await this.create({
      key: SITE_KEY,
      ...DEFAULT_CONTACT,
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return this.findOne({ key: SITE_KEY });
    }

    throw error;
  }
};

const Contact = mongoose.model('Contact', contactSchema);

Contact.SITE_KEY = SITE_KEY;
Contact.DEFAULT_CONTACT = DEFAULT_CONTACT;

module.exports = Contact;
