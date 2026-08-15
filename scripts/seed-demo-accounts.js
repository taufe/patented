#!/usr/bin/env node

require('dotenv').config();

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const connectDB = require('../config/db');

const DEMO_ACCOUNTS = [
  {
    name: 'Demo User',
    email: 'user@patented.app',
    password: 'User@123',
    role: 'user',
  },
  {
    name: 'Demo Admin',
    email: 'admin@patented.app',
    password: 'Admin@123',
    role: 'admin',
  },
  {
    name: 'Ahmed Ali',
    email: 'ahmed@example.com',
    password: 'User@123',
    role: 'user',
  },
  {
    name: 'Muhammad Qaseem',
    email: 'qaseem@example.com',
    password: 'User@123',
    role: 'user',
  },
];

const seed = async () => {
  await connectDB();

  for (const account of DEMO_ACCOUNTS) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(account.password, salt);
    const existing = await User.findOne({ email: account.email });

    if (existing) {
      existing.name = account.name;
      existing.password = hashedPassword;
      existing.role = account.role;
      await existing.save();
      console.log(`Updated ${account.role}: ${account.email}`);
    } else {
      await User.create({
        name: account.name,
        email: account.email,
        password: hashedPassword,
        role: account.role,
      });
      console.log(`Created ${account.role}: ${account.email}`);
    }
  }

  process.exit(0);
};

seed().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
