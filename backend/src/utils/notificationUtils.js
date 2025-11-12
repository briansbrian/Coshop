/**
 * Notification Utilities
 * Re-exports notification service functions for backward compatibility
 * This file maintains the existing API while delegating to the notification service
 */

export {
  notifyNewOrder,
  notifyOrderStatusChange,
  notifyNewMessage,
  notifyNewReview,
  notifyLowInventory,
  notifyPaymentReceived
} from '../services/notificationService.js';
