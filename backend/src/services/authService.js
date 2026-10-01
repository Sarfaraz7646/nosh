const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const httpError = require('./httpError');

function createToken(user) {
  if (!process.env.JWT_SECRET) throw httpError(503, 'Authentication is not configured.');
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function serializeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };
}

async function register({ name, email, password, role = 'CUSTOMER' }) {
  if (!name?.trim() || !email?.trim() || !password) {
    throw httpError(400, 'Name, email, and password are required.');
  }
  if (password.length < 8) throw httpError(400, 'Password must be at least 8 characters.');
  if (!['CUSTOMER', 'RESTAURANT', 'DELIVERY_PARTNER'].includes(role)) {
    throw httpError(400, 'Registration role must be CUSTOMER, RESTAURANT, or DELIVERY_PARTNER.');
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail })) throw httpError(409, 'An account with this email already exists.');

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: await bcrypt.hash(password, 12),
    role,
  });
  return { user: serializeUser(user), token: createToken(user) };
}

async function login({ email, password }) {
  if (!email?.trim() || !password) throw httpError(400, 'Email and password are required.');
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw httpError(401, 'Email or password is incorrect.');
  }
  return { user: serializeUser(user), token: createToken(user) };
}

module.exports = { register, login };
