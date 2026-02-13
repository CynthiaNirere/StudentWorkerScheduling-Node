import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const Notification = sequelize.define(
  "Notification",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "notification_id",
    },
    userId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "user_id",
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isRead: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "is_read",
    },
    createdAt: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "created_at",
    },
  },
  {
    tableName: "notifications",
    timestamps: false,
  }
);

export default Notification;