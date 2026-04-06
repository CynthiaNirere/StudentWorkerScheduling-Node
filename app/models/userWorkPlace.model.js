import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const UserWorkplace = sequelize.define(
  "UserWorkplace",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "user_id",
    },
    locationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "location_id",
    },
    createdAt: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "created_at",
    },
  },
  {
    tableName: "UserWorkplace",
    timestamps: false,
  }
);

export default UserWorkplace;