import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const Availability = sequelize.define(
  "Availability",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "availability_id",
    },
    userId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "user_id",
    },
    dayOfWeek: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "day_of_week",
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
    effectiveDate: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: "effective_date",
    },
    isActive: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
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
    tableName: "Availability",
    timestamps: false,
  }
);

export default Availability;