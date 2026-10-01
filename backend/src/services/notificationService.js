const Notification = require('../models/Notification');

async function notifyUser(io, { userId, type, title, message, data = {} }) {
  try {
    const notification = await Notification.create({ userId, type, title, message, data });
    const payload = notification.toObject();
    io?.to(`user:${userId}`).emit('notification:new', payload);
    return payload;
  } catch (error) {
    console.error('Unable to persist notification:', error.message);
    return null;
  }
}

module.exports = { notifyUser };
