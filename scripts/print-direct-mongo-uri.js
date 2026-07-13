#!/usr/bin/env node

/**
 * Run locally to print the standard (non-SRV) MongoDB URI for Vercel.
 * Usage: node scripts/print-direct-mongo-uri.js
 */

require('dotenv').config();
const { getMongoUri } = require('../config/env');
const { srvToDirectUri } = require('../config/resolveMongoUri');

const main = async () => {
  const mongoUri = getMongoUri();

  if (!mongoUri) {
    console.error('MONGO_URI is not set in .env');
    process.exit(1);
  }

  if (!mongoUri.startsWith('mongodb+srv://')) {
    console.log('MONGO_URI is already a standard connection string. Copy it to Vercel as MONGO_URI or MONGO_URI_DIRECT.');
    console.log(mongoUri);
    process.exit(0);
  }

  const directUri = await srvToDirectUri(mongoUri);

  console.log('Copy this value into Vercel → Settings → Environment Variables');
  console.log('Name: MONGO_URI_DIRECT (or replace MONGO_URI)');
  console.log('');
  console.log(directUri);
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
