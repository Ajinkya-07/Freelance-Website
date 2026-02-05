const Notification = require('../models/Notification');

/**
 * Get all notifications for the authenticated user
 */
async function getNotifications(req, res) {
  try {
    const { limit = 50, offset = 0, unreadOnly = false } = req.query;
    
    const notifications = Notification.findByUser(req.user.id, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      unreadOnly: unreadOnly === 'true'
    });

    const unreadCount = Notification.getUnreadCount(req.user.id);

    res.json({
      success: true,
      notifications,
      unreadCount
    });
  } catch (err) {
    console.error('GET NOTIFICATIONS ERROR:', err);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
}

/**
 * Get unread notification count
 */
async function getUnreadCount(req, res) {
  try {
    const count = Notification.getUnreadCount(req.user.id);
    res.json({ success: true, unreadCount: count });
  } catch (err) {
    console.error('GET UNREAD COUNT ERROR:', err);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
}

/**
 * Mark a notification as read
 */
async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    Notification.markAsRead(id, req.user.id);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    console.error('MARK AS READ ERROR:', err);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
}

/**
 * Mark all notifications as read
 */
async function markAllAsRead(req, res) {
  try {
    Notification.markAllAsRead(req.user.id);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    console.error('MARK ALL AS READ ERROR:', err);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
}

/**
 * Delete a notification
 */
async function deleteNotification(req, res) {
  try {
    const { id } = req.params;
    Notification.delete(id, req.user.id);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    console.error('DELETE NOTIFICATION ERROR:', err);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
}

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
