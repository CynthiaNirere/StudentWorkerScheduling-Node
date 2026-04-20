import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const Shift = sequelize.define(
  "Shift",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'shift_id'
    },
    shiftTime: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'shift_time'
    },
    startTime: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'start_time'
    },
    endTime: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'end_time'
    },
    createdBy: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'created_by'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    userId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'user_id'
    },
    dayOfWeek: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'day_of_week'
    },
    minimumWorkers: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      field: 'minimum_workers'
    },
    maximumWorkers: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      field: 'maximum_workers'
    },
    locationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'location_id'
    },
    jobRoleId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'job_role_id'
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'draft',
      validate: {
        isIn: [['draft', 'published', 'completed', 'cancelled']]
      }
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
    tableName: "Shift",
    timestamps: false,
  }
);

export default Shift;