import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const Coverage = sequelize.define(
  "Coverage",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "template_id",
    },
    locationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "location_id",
    },
    jobRoleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "job_role_id",
    },
    dayOfWeek: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "day_of_week",
      validate: {
        min: 0,
        max: 6,
      },
    },
    startTime: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "start_time",
    },
    endTime: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "end_time",
    },
    numberOfWorkersNeeded: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "number_of_workers_needed",
    },
    isActive: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: "is_active",
    },
  },
  {
    tableName: "coverage",
    timestamps: false,
  }
);

export default Coverage;