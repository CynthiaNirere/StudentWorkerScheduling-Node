import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const TaskList = sequelize.define(
  "TaskList",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
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
    createdBy: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'created_by'
    },
    assignedTo: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'assigned_to'
    },
    dueDate: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'due_date'
    },
    priority: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        isIn: [['low', 'medium', 'high', 'urgent']]
      }
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'active',
      validate: {
        isIn: [['active', 'completed', 'archived']]
      }
    },
    locationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'location_id'
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
    tableName: "TaskList",
    timestamps: false,
  }
);

export default TaskList;