const Pdf = require('../models/Pdf');
const { deleteStoredPdf } = require('./pdfStorage.service');

const deletePdfsAndFiles = async (query) => {
  const pdfs = await Pdf.find(query).select('storageKey');

  await Promise.all(
    pdfs.map(async (pdf) => {
      try {
        await deleteStoredPdf(pdf.storageKey);
      } catch (error) {
        console.error(`Failed to delete stored PDF ${pdf._id}: ${error.message}`);
      }
    })
  );

  await Pdf.deleteMany(query);

  return pdfs.length;
};

module.exports = {
  deletePdfsAndFiles,
};
