// notificationservice.js
class NotificationService {
  constructor() {
    this.logger = console;
  }

  /**
   * Send a notification message
   * @param {string} message - The message to log
   */
  async send(message) {
    try {
      // Log to console (can be replaced with more sophisticated logging)
      this.logger.info(`[NOTIFICATION]: ${message}`);

      // In production, you might want to add:
      // 1. Database logging
      // 2. Email alerts
      // 3. Slack/webhook notifications

      return { success: true, message: "Notification sent" };
    } catch (error) {
      this.logger.error("Failed to send notification:", error);
      return { success: false, message: "Notification failed" };
    }
  }

  /**
   * Send a formatted user-related notification
   * @param {string} action - The action performed
   * @param {object} userData - User details
   */
  async sendUserNotification(action, userData) {
    const message = `${action}: ${userData.email}`;
    return this.send(message);
  }
}

// Export singleton instance
const notificationService = new NotificationService();
export default notificationService;
