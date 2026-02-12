import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const TimeOffRequest = sequelize.define(
  "TimeOffRequest",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'request_id'
    },
    userId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'user_id'
    },
    startDate: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'start_date'
    },
    endDate: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'end_date'
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'approved', 'denied']]
      }
    },
    createdAt: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'created_at'
    },
    approvedBy: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'approved_by'
    },
    approvedAt: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'approved_at'
    }
  },
  {
    tableName: "Time_Off_Request",
    timestamps: false,
  }
);

export default TimeOffRequest;