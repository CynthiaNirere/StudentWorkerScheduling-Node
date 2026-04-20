import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const Clock = sequelize.define(
  "Clock",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "clock_id",
    },
    shiftId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "shift_id",
    },
    userId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "user_id",
    },
    clockInTime: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "clock_in_time",
    },
    clockOutTime: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: "clock_out_time",
    },
    totalHoursWorked: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: "total_hours_worked",
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    approvedBy: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "approved_by",
    },
    approvedAt: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: "approved_at",
    },
    createdAt: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "created_at",
    },
  },
  {
    tableName: "Clock_IN_Clock_OUT",
    timestamps: false,
  }
);

export default Clock;