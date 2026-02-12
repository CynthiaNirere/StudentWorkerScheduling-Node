import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const Session = sequelize.define(
  "Session",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "session_id",
    },
    userId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "user_id",
    },
    token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    createdAt: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "created_at",
    },
    isActive: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: "is_active",
    },
    expiresAt: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: "expires_at",
    },
  },
  {
    tableName: "Session",
    timestamps: false,
  }
);

export default Session;