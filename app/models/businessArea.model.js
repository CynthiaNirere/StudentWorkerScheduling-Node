import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const BusinessArea = sequelize.define(
  "BusinessArea",
  {
    location_id: {
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
 // },
  //{
   // tableName: "Session",
   // },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: () => Date.now(),
    },
    updated_at: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
  },
  {
    tableName: "Business_Area",
    timestamps: false,
  }
);

export default BusinessArea;