import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const ScheduleTemplate = sequelize.define(
  "ScheduleTemplate",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "template_id",
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "name",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "description",
    },
    createdBy: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "created_by",
    },
    locationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "location_id",
    },
    // Store the entire week's shifts as JSON
    templateData: {
      type: DataTypes.JSON,
      allowNull: false,
      field: "template_data",
      comment: "JSON array of shifts with day, startTime, endTime, jobRoleId, notes",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
    },
    createdAt: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "created_at",
    },
    updatedAt: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: "updated_at",
    },
  },
  {
    tableName: "ScheduleTemplate",
    timestamps: false,
  }
);

export default ScheduleTemplate;