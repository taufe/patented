const Contact = require('../../models/Contact');
const { toPublicContact } = require('../../utils/contactResponse');

const getContact = async (req, res) => {
  try {
    const contact = await Contact.getOrCreate();

    res.json({
      success: true,
      contact: toPublicContact(contact),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching contact',
      error: error.message,
    });
  }
};

module.exports = {
  getContact,
};
