import db from '../models/index.js';
import * as emailService from '../services/emailService.js';

const User = db.user;

/**
 * Check if user has email notifications enabled
 * This checks the user's preference stored in the database
 */
export const shouldSendEmail = async (userId) => {
  try {
    const user = await User.findByPk(userId);
    if (!user || !user.email) return false;
    
    // Check if user has emailNotifications preference set to true
    // This field should be added to User model
    return user.emailNotifications === true || user.emailNotifications === 1;
  } catch (error) {
    console.error('Error checking email preference:', error);
    return false;
  }
};

/**
 * Send shift assignment notification if user has email enabled
 */
export const notifyShiftAssignment = async (userId, shiftDetails) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) return;
    
    const shouldEmail = await shouldSendEmail(userId);
    if (shouldEmail) {
      const employeeName = `${user.fName || ''} ${user.lName || ''}`.trim();
      await emailService.sendShiftAssignmentEmail(user.email, employeeName, shiftDetails);
    }
  } catch (error) {
    console.error('Error sending shift assignment notification:', error);
  }
};

/**
 * Send shift reminder if user has email enabled
 */
export const notifyShiftReminder = async (userId, shiftDetails) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) return;
    
    const shouldEmail = await shouldSendEmail(userId);
    if (shouldEmail) {
      const employeeName = `${user.fName || ''} ${user.lName || ''}`.trim();
      await emailService.sendShiftReminderEmail(user.email, employeeName, shiftDetails);
    }
  } catch (error) {
    console.error('Error sending shift reminder:', error);
  }
};

/**
 * Send swap request notification
 */
export const notifySwapRequest = async (toUserId, fromUserId, swapDetails) => {
  try {
    const [toUser, fromUser] = await Promise.all([
      User.findByPk(toUserId),
      User.findByPk(fromUserId)
    ]);
    
    if (!toUser || !fromUser) return;
    
    const shouldEmail = await shouldSendEmail(toUserId);
    if (shouldEmail) {
      const toName = `${toUser.fName || ''} ${toUser.lName || ''}`.trim();
      const fromName = `${fromUser.fName || ''} ${fromUser.lName || ''}`.trim();
      
      await emailService.sendSwapRequestEmail(toUser.email, toName, {
        ...swapDetails,
        fromEmployee: fromName
      });
    }
  } catch (error) {
    console.error('Error sending swap request notification:', error);
  }
};

/**
 * Send time off approval notification
 */
export const notifyTimeOffApproved = async (userId, requestDetails) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) return;
    
    const shouldEmail = await shouldSendEmail(userId);
    if (shouldEmail) {
      const employeeName = `${user.fName || ''} ${user.lName || ''}`.trim();
      await emailService.sendTimeOffApprovedEmail(user.email, employeeName, requestDetails);
    }
  } catch (error) {
    console.error('Error sending time off approved notification:', error);
  }
};

/**
 * Send time off denial notification
 */
export const notifyTimeOffDenied = async (userId, requestDetails) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) return;
    
    const shouldEmail = await shouldSendEmail(userId);
    if (shouldEmail) {
      const employeeName = `${user.fName || ''} ${user.lName || ''}`.trim();
      await emailService.sendTimeOffDeniedEmail(user.email, employeeName, requestDetails);
    }
  } catch (error) {
    console.error('Error sending time off denied notification:', error);
  }
};

/**
 * Send schedule change notification
 */
export const notifyScheduleChange = async (userId, changeDetails) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) return;
    
    const shouldEmail = await shouldSendEmail(userId);
    if (shouldEmail) {
      const employeeName = `${user.fName || ''} ${user.lName || ''}`.trim();
      await emailService.sendScheduleChangeEmail(user.email, employeeName, changeDetails);
    }
  } catch (error) {
    console.error('Error sending schedule change notification:', error);
  }
};

export default {
  shouldSendEmail,
  notifyShiftAssignment,
  notifyShiftReminder,
  notifySwapRequest,
  notifyTimeOffApproved,
  notifyTimeOffDenied,
  notifyScheduleChange,
};
