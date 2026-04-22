import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const TaskAssignment = sequelize.define(
  "TaskAssignment",
  {
    id: {
      type:          DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey:    true,
      field:         "assignment_id",
    },
    tasklistId: {
      type:      DataTypes.INTEGER,
      allowNull: false,
      field:     "tasklist_id",
    },
    employeeId: {
      type:      DataTypes.STRING(255),
      allowNull: false,
      field:     "employee_id",
    },
    shiftId: {
      type:      DataTypes.INTEGER,
      allowNull: true,
      field:     "shift_id",
    },
    assignedDate: {
      type:      DataTypes.BIGINT,
      allowNull: false,
      field:     "assigned_date",
    },
    assignedBy: {
      type:      DataTypes.STRING(255),
      allowNull: false,
      field:     "assigned_by",
    },
    status: {
      type:         DataTypes.STRING(50),
      defaultValue: "active",
      field:        "status",
    },
    createdAt: {
      type:      DataTypes.BIGINT,
      allowNull: false,
      field:     "created_at",
    },
    updatedAt: {
      type:      DataTypes.BIGINT,
      allowNull: true,
      field:     "updated_at",
    },
  },
  {
    tableName:  "TaskAssignment",
    timestamps: false,
  }
);

export default TaskAssignment;