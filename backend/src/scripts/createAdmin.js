const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

async function createAdmin() {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD before creating an admin account.');
  }
  if (ADMIN_PASSWORD.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters.');

  await connectDB();
  const email = ADMIN_EMAIL.trim().toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== 'ADMIN') throw new Error('That email already belongs to a non-admin account. Choose another admin email.');
    console.log('Admin account already exists.');
    return;
  }

  await User.create({
    name: ADMIN_NAME.trim(),
    email,
    password: await bcrypt.hash(ADMIN_PASSWORD, 12),
    role: 'ADMIN',
  });
  console.log('Admin account created.');
}

createAdmin()
  .catch((error) => {
    console.error('Unable to create admin account:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  });
