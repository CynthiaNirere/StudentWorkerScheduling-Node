import db from "../models/index.js";

const Message = db.message;

const getSenderId = (req) => req.user?.userId || req.user?.user_id || req.user?.id;

// ── SEND ──────────────────────────────────────────────────────────────────
export const send = async (req, res) => {
  try {
    const { recipientId, subject, message, messageType, linkUrl, thread_id } = req.body;

    if (!message) return res.status(400).send({ message: "Message content is required!" });

    const senderId = getSenderId(req);
    const type     = messageType || 'direct';

    if (!['direct','broadcast','link_share'].includes(type))
      return res.status(400).send({ message: "Invalid message type!" });

    let resolvedRecipientId = null;

    if (type === 'direct') {
      if (recipientId) {
        resolvedRecipientId = Array.isArray(recipientId) ? recipientId[0] : recipientId;
      } else {
        // Auto-route null recipient to manager at sender's work_location
        const [sender] = await db.sequelize.query(
          'SELECT work_location FROM User WHERE user_id = ?',
          { replacements: [senderId], type: db.Sequelize.QueryTypes.SELECT }
        );
        if (sender?.work_location) {
          const [manager] = await db.sequelize.query(
            'SELECT user_id FROM User WHERE work_location = ? AND role = "employer" LIMIT 1',
            { replacements: [sender.work_location], type: db.Sequelize.QueryTypes.SELECT }
          );
          if (manager) resolvedRecipientId = manager.user_id;
        }
      }
    }

    const recipientIds = type === 'broadcast'
      ? [null]
      : Array.isArray(recipientId) && recipientId.length > 1
        ? recipientId
        : [resolvedRecipientId];

    const now      = Date.now();
    const threadId = thread_id || `${type}-${senderId}-${resolvedRecipientId || 'all'}-${now}`;

    const created = await Message.bulkCreate(
      recipientIds.map(rid => ({
        senderId,
        recipientId:  type === 'broadcast' ? null : rid,
        subject:      subject || null,
        message,
        messageType:  type,
        linkUrl:      linkUrl || null,
        threadId,
        isRead:       false,
        createdAt:    now,
        readAt:       null,
      }))
    );

    res.status(201).send({
      message:  `Message sent to ${created.length} recipient(s) successfully!`,
      data:     created,
      threadId,
    });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).send({ message: "Error sending message." });
  }
};

// ── INBOX ─────────────────────────────────────────────────────────────────
export const getInbox = async (req, res) => {
  try {
    const userId = getSenderId(req);

    const messages = await db.sequelize.query(`
      SELECT
        m.message_id,
        m.sender_id,
        m.recipient_id,
        m.subject,
        m.message,
        m.message_type,
        m.link_url,
        m.thread_id,
        m.is_read,
        m.created_at,
        m.read_at,
        CONCAT(s.first_name, ' ', s.last_name) AS sender_name,
        s.email AS sender_email,
        CONCAT(r.first_name, ' ', r.last_name) AS recipient_name,
        r.email AS recipient_email
      FROM Message m
      LEFT JOIN User s ON m.sender_id    = s.user_id
      LEFT JOIN User r ON m.recipient_id = r.user_id
      WHERE
        m.recipient_id = ?
        OR
        (m.recipient_id IS NULL AND m.message_type = 'broadcast' AND m.sender_id != ?)
      ORDER BY m.created_at DESC
    `, {
      replacements: [userId, userId],
      type: db.Sequelize.QueryTypes.SELECT,
    });

    res.send(messages);
  } catch (err) {
    console.error("Error retrieving inbox:", err);
    res.status(500).send({ message: "Error retrieving inbox." });
  }
};

// ── SENT MESSAGES ─────────────────────────────────────────────────────────
export const getSentMessages = async (req, res) => {
  try {
    const userId = getSenderId(req);

    const messages = await db.sequelize.query(`
      SELECT
        m.message_id,
        m.sender_id,
        m.recipient_id,
        m.subject,
        m.message,
        m.message_type,
        m.link_url,
        m.thread_id,
        m.is_read,
        m.created_at,
        m.read_at,
        CONCAT(s.first_name, ' ', s.last_name) AS sender_name,
        s.email AS sender_email,
        CONCAT(r.first_name, ' ', r.last_name) AS recipient_name,
        r.email AS recipient_email
      FROM Message m
      LEFT JOIN User s ON m.sender_id    = s.user_id
      LEFT JOIN User r ON m.recipient_id = r.user_id
      WHERE m.sender_id = ?
      ORDER BY m.created_at DESC
    `, {
      replacements: [userId],
      type: db.Sequelize.QueryTypes.SELECT,
    });

    res.send(messages);
  } catch (err) {
    console.error("Error retrieving sent messages:", err);
    res.status(500).send({ message: "Error retrieving sent messages." });
  }
};

// ── MARK AS READ ──────────────────────────────────────────────────────────
export const markAsRead = async (req, res) => {
  try {
    const [updated] = await Message.update(
      { isRead: true, readAt: Date.now() },
      { where: { message_id: req.params.id } }
    );
    if (updated === 1) res.send({ message: "Message marked as read." });
    else res.status(404).send({ message: "Message not found." });
  } catch (err) {
    console.error("Error marking message as read:", err);
    res.status(500).send({ message: "Error marking message as read." });
  }
};

// ── DELETE ────────────────────────────────────────────────────────────────
export const remove = async (req, res) => {
  try {
    const deleted = await Message.destroy({ where: { message_id: req.params.id } });
    if (deleted) res.send({ message: "Message deleted successfully!" });
    else res.status(404).send({ message: "Message not found!" });
  } catch (err) {
    console.error("Error deleting message:", err);
    res.status(500).send({ message: "Error deleting message." });
  }
};

// ── UNREAD COUNT ──────────────────────────────────────────────────────────
export const getUnreadCount = async (req, res) => {
  try {
    const userId = getSenderId(req);

    const [result] = await db.sequelize.query(`
      SELECT COUNT(*) AS unreadCount
      FROM Message
      WHERE (
        recipient_id = ?
        OR (recipient_id IS NULL AND message_type = 'broadcast' AND sender_id != ?)
      )
      AND is_read = 0
    `, {
      replacements: [userId, userId],
      type: db.Sequelize.QueryTypes.SELECT,
    });

    res.send({ unreadCount: Number(result.unreadCount) });
  } catch (err) {
    console.error("Error getting unread count:", err);
    res.status(500).send({ message: "Error getting unread count." });
  }
};

// ── BROADCAST ─────────────────────────────────────────────────────────────
export const broadcast = async (req, res) => {
  try {
    const { subject, message, linkUrl } = req.body;
    if (!message) return res.status(400).send({ message: "Message content is required!" });

    const senderId = getSenderId(req);
    const now      = Date.now();

    const msg = await Message.create({
      senderId,
      recipientId:  null,
      subject:      subject || "Announcement",
      message,
      messageType:  'broadcast',
      linkUrl:      linkUrl || null,
      threadId:     `broadcast-${senderId}-${now}`,
      isRead:       false,
      createdAt:    now,
      readAt:       null,
    });

    const [countResult] = await db.sequelize.query(
      'SELECT COUNT(*) AS empCount FROM User WHERE role = "employee"',
      { type: db.Sequelize.QueryTypes.SELECT }
    );

    res.status(201).send({
      message:        `Broadcast sent to ${countResult.empCount} employees!`,
      data:           msg,
      recipientCount: Number(countResult.empCount),
    });
  } catch (err) {
    console.error("Error broadcasting message:", err);
    res.status(500).send({ message: "Error broadcasting message." });
  }
};