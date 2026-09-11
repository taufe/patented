const Contact = require('../../models/Contact');
const { toPublicContact, applyContactUpdates } = require('../../utils/contactResponse');

const getContact = async (req, res) => {
  try {
    const contact = await Contact.getOrCreate();

    res.json({
      success: true,
      message: 'Contact settings fetched successfully',
      contact: toPublicContact(contact),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching contact settings',
      error: error.message,
    });
  }
};

const updateContact = async (req, res) => {
  try {
    const hasUpdate =
      req.body.whatsapp !== undefined ||
      req.body.phone !== undefined ||
      req.body.email !== undefined;

    if (!hasUpdate) {
      return res.status(400).json({
        success: false,
        message: 'Provide at least one of whatsapp, phone, or email',
      });
    }

    const contact = await Contact.getOrCreate();
    applyContactUpdates(contact, req.body);
    await contact.save();

    res.json({
      success: true,
      message: 'Contact settings updated successfully',
      contact: toPublicContact(contact),
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;

    res.status(statusCode).json({
      success: false,
      message:
        statusCode === 400 ? error.message : 'Server error while updating contact settings',
      ...(statusCode !== 400 && { error: error.message }),
    });
  }
};

module.exports = {
  getContact,
  updateContact,
};
