import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const TaskListItem = sequelize.define(
  "TaskListItem",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'item_id'
    },
    tasklistId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'tasklist_id'
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    assignedTo: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'assigned_to'
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'pending',
    },
    completedBy: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'completed_by'
    },
    orderPosition: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'order_position'
    },
    createdAt: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'updated_at'
    }
  },
  {
    tableName: "TaskListItem",
    timestamps: false,
  }
);

export default TaskListItem;