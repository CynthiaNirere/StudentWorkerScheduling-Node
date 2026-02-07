import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const Schedule = sequelize.define(
  "Schedule",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "schedule_id",
    },
    locationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "location_id",
    },
    weekStartDate: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "week_start_date",
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "created_by",
    },
    publishedAt: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: "published_at",
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
    tableName: "Schedule",
    timestamps: false,
  }
);

export default Schedule;