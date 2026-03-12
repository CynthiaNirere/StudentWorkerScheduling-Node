import db from "../models/index.js";

const Message = db.message;
const User = db.user;
const { Op } = db.Sequelize;

// Send a message (direct or broadcast)
export const send = async (req, res) => {
  try {
    const { recipientId, subject, message, messageType, linkUrl } = req.body;
    
    if (!message) {
      return res.status(400).send({ message: "Message content is required!" });
    }
    
    const senderId = req.user?.userId || req.user?.user_id || req.user?.id;
    
    // Validate message type
    const validTypes = ['direct', 'broadcast', 'link_share'];
    const type = messageType || 'direct';
    
    if (!validTypes.includes(type)) {
      return res.status(400).send({ message: "Invalid message type!" });
    }
    
    // For direct messages, recipient is required
    if (type === 'direct' && !recipientId) {
      return res.status(400).send({ message: "Recipient ID is required for direct messages!" });
    }
    
    // Support single recipientId (string) or multiple (array)
    const recipientIds = type === 'broadcast'
      ? [null]
      : Array.isArray(recipientId) ? recipientId : [recipientId];
    
    const now = Date.now();
    const messagesToCreate = recipientIds.map(rid => ({
      senderId,
      recipientId: rid,
      subject: subject || null,
      message,
      messageType: type,
      linkUrl: linkUrl || null,
      isRead: false,
      createdAt: now,
      readAt: null
    }));
    
    const newMessages = await Message.bulkCreate(messagesToCreate);
    
    res.status(201).send({
      message: `Message sent to ${newMessages.length} recipient(s) successfully!`,
      data: newMessages
    });
    
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).send({ message: "Error sending message." });
  }
};

// Get all messages for current user (inbox)
export const getInbox = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.user_id || req.user?.id;
    
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { recipientId: userId },
          { recipientId: null, messageType: 'broadcast' }
        ]
      },
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'fName', 'lName', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });
    
    const formattedMessages = messages.map(msg => ({
      message_id: msg.message_id,
      sender_id: msg.senderId,
      sender_name: msg.sender ? `${msg.sender.fName} ${msg.sender.lName}` : 'Unknown',
      sender_email: msg.sender ? msg.sender.email : null,
      recipient_id: msg.recipientId,
      subject: msg.subject,
      message: msg.message,
      message_type: msg.messageType,
      link_url: msg.linkUrl,
      is_read: msg.isRead,
      created_at: msg.createdAt,
      read_at: msg.readAt
    }));
    
    res.send(formattedMessages);
    
  } catch (err) {
    console.error("Error retrieving inbox:", err);
    res.status(500).send({ message: "Error retrieving inbox." });
  }
};

// Get sent messages
export const getSentMessages = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.user_id || req.user?.id;
    
    const messages = await Message.findAll({
      where: { senderId: userId },
      include: [{
        model: User,
        as: 'recipient',
        attributes: ['id', 'fName', 'lName', 'email'],
        required: false
      }],
      order: [['createdAt', 'DESC']]
    });
    
    // Group messages sent at the same time (multi-recipient) into one entry
    const groupMap = new Map();
    for (const msg of messages) {
      const groupKey = `${msg.createdAt}_${msg.subject}_${msg.messageType}`;
      if (groupMap.has(groupKey)) {
        const group = groupMap.get(groupKey);
        if (msg.recipient) {
          group.recipients.push(`${msg.recipient.fName} ${msg.recipient.lName}`);
          group.recipient_ids.push(msg.recipientId);
        }
        group.message_ids.push(msg.message_id);
      } else {
        groupMap.set(groupKey, {
          message_id: msg.message_id,
          message_ids: [msg.message_id],
          recipient_ids: msg.recipientId ? [msg.recipientId] : [],
          recipients: msg.recipient ? [`${msg.recipient.fName} ${msg.recipient.lName}`] : [],
          subject: msg.subject,
          message: msg.message,
          message_type: msg.messageType,
          link_url: msg.linkUrl,
          is_read: msg.isRead,
          created_at: msg.createdAt,
          read_at: msg.readAt
        });
      }
    }

    const formattedMessages = Array.from(groupMap.values()).map(group => ({
      ...group,
      recipient_name: group.message_type === 'broadcast'
        ? 'All Employees'
        : group.recipients.join(', ')
    }));
    
    res.send(formattedMessages);
    
  } catch (err) {
    console.error("Error retrieving sent messages:", err);
    res.status(500).send({ message: "Error retrieving sent messages." });
  }
};

// Mark message as read
export const markAsRead = async (req, res) => {
  try {
    const messageId = req.params.id;
    
    const [updated] = await Message.update(
      { isRead: true, readAt: Date.now() },
      { where: { message_id: messageId } }
    );
    
    if (updated === 1) {
      res.send({ message: "Message marked as read." });
    } else {
      res.status(404).send({ message: "Message not found." });
    }
    
  } catch (err) {
    console.error("Error marking message as read:", err);
    res.status(500).send({ message: "Error marking message as read." });
  }
};

// Delete message
export const remove = async (req, res) => {
  try {
    const messageId = req.params.id;
    
    const deleted = await Message.destroy({
      where: { message_id: messageId }
    });
    
    if (deleted) {
      res.send({ message: "Message deleted successfully!" });
    } else {
      res.status(404).send({ message: "Message not found!" });
    }
    
  } catch (err) {
    console.error("Error deleting message:", err);
    res.status(500).send({ message: "Error deleting message." });
  }
};

// Get unread count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.user_id || req.user?.id;
    
    const count = await Message.count({
      where: {
        [Op.or]: [
          { recipientId: userId },
          { recipientId: null, messageType: 'broadcast' }
        ],
        isRead: false
      }
    });
    
    res.send({ unreadCount: count });
    
  } catch (err) {
    console.error("Error getting unread count:", err);
    res.status(500).send({ message: "Error getting unread count." });
  }
};

// Broadcast message to all employees
export const broadcast = async (req, res) => {
  try {
    const { subject, message, linkUrl } = req.body;
    
    if (!message) {
      return res.status(400).send({ message: "Message content is required!" });
    }
    
    const senderId = req.user?.userId || req.user?.user_id || req.user?.id;
    
    const broadcastMessage = await Message.create({
      senderId,
      recipientId: null,
      subject: subject || "Announcement",
      message,
      messageType: 'broadcast',
      linkUrl: linkUrl || null,
      isRead: false,
      createdAt: Date.now(),
      readAt: null
    });
    
    // Count how many employees will receive it
    const employeeCount = await User.count({
      where: { role: 'employee' }
    });
    
    res.status(201).send({
      message: `Broadcast message sent to ${employeeCount} employees!`,
      data: broadcastMessage,
      recipientCount: employeeCount
    });
    
  } catch (err) {
    console.error("Error broadcasting message:", err);
    res.status(500).send({ message: "Error broadcasting message." });
  }
};