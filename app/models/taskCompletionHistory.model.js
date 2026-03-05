import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const TaskCompletionHistory = sequelize.define(
  "TaskCompletionHistory",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'history_id'
    },
    taskListId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'task_list_id'
    },
    itemId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'item_id'
    },
    completedBy: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'completed_by'
    },
    completedAt: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'completed_at'
    },
    shiftId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'shift_id'
    },
    date: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'created_at'
    }
  },
  {
    tableName: "TaskCompletionHistory",
    timestamps: false,
  }
);

export default TaskCompletionHistory;