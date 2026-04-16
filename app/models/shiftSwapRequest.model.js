import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const ShiftSwapRequest = sequelize.define(
  "ShiftSwapRequest",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'swap_id'
    },
    originalShiftId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'original_shift_id'
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'accepted', 'approved', 'rejected', 'cancelled']]
      }
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    tableName: "Shift_Swap_Request",
    timestamps: false,
  }
);

export default ShiftSwapRequest;