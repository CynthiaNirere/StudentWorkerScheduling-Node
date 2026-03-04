import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const ShiftSwapRequestUser = sequelize.define(
  "ShiftSwapRequestUser",
  {
    swapId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      field: 'swap_id'
    },
    userId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'user_id'
    },
    requestingUserId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'requesting_user_id'
    },
    acceptingUserId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'accepting_user_id'
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'pending'
    }
  },
  {
    tableName: "Shift_Swap_Request_User",
    timestamps: false,
  }
);

export default ShiftSwapRequestUser;
