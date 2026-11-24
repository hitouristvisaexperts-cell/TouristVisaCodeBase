const Notification = require('../models/Notification');
const { emitToUser } = require('./socketHelper');

const notify = async ({ recipient, title, message, type = 'general' }) => {
  try {
    const notif = await Notification.create({ recipient, title, message, type });
    // Push real-time notification to connected client
    emitToUser(recipient, 'notification', {
      _id: notif._id,
      title,
      message,
      type,
      isRead: false,
      createdAt: notif.createdAt,
    });
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};

module.exports = notify;
