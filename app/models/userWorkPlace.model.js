import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const UserWorkplace = sequelize.define(
  "UserWorkplace",
  {
    id: {
      type:          DataTypes.INTEGER,
      primaryKey:    true,
      autoIncrement: true,
    },
    userId: {
      type:      DataTypes.STRING(255),
      allowNull: false,
      field:     "user_id",
    },
    locationId: {
      type:      DataTypes.INTEGER,
      allowNull: false,
      field:     "location_id",
    },
    isActive: {
      type:         DataTypes.TINYINT,
      allowNull:    false,
      defaultValue: 1,
      field:        "is_active",
    },
    terminatedAt: {
      type:      DataTypes.BIGINT,
      allowNull: true,
      field:     "terminated_at",
    },
    createdAt: {
      type:      DataTypes.BIGINT,
      allowNull: false,
      field:     "created_at",
    },
  },
  {
    tableName:  "UserWorkplace",
    timestamps: false,
  }
);

export default UserWorkplace;