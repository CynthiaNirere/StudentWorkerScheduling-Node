export default (sequelize, Sequelize) => {
  const Message = sequelize.define("message", {
    message_id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'message_id'
    },
    senderId: {
      type: Sequelize.STRING(255),
      allowNull: false,
      field: 'sender_id'
    },
    recipientId: {
      type: Sequelize.STRING(255),
      allowNull: true,
      field: 'recipient_id'
    },
    subject: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },
    message: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    messageType: {
      type: Sequelize.STRING(50),
      defaultValue: 'direct',
      field: 'message_type'
    },
    linkUrl: {
      type: Sequelize.TEXT,
      allowNull: true,
      field: 'link_url'
    },
    // ✅ threadId groups messages into a conversation thread
    threadId: {
      type: Sequelize.STRING(255),
      allowNull: true,
      field: 'thread_id'
    },
    parentMessageId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      field: 'parent_message_id'
    },
    isRead: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      field: 'is_read'
    },
    createdAt: {
      type: Sequelize.BIGINT,
      allowNull: false,
      field: 'created_at'
    },
    readAt: {
      type: Sequelize.BIGINT,
      allowNull: true,
      field: 'read_at'
    }
  }, {
    tableName: 'Message',
    timestamps: false
  });

  return Message;
};