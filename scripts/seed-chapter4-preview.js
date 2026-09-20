#!/usr/bin/env node

require('dotenv').config();

const connectDB = require('../config/db');
const { applyAllChapter4Previews } = require('../utils/chapter4Preview');

const run = async () => {
  await connectDB();
  const results = await applyAllChapter4Previews();

  if (results.length === 0) {
    console.log('No Chapter 4 found. Nothing to update.');
    process.exit(0);
  }

  results.forEach((result) => {
    console.log(
      `Chapter 4 "${result.title}": first video free, ${result.total - 1} locked (${result.updated} updated)`
    );
  });

  process.exit(0);
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
