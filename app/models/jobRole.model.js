import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const JobRole = sequelize.define(
  "JobRole",
  {
    job_role_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: () => Date.now(),
    },
    updated_at: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
  },
  {
    tableName: "Job_Role",
    timestamps: false,
  }
);

export default JobRole;