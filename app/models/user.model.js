import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.STRING(255),
      primaryKey: true,
      field: "user_id",
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    fName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "first_name",
    },
    lName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "last_name",
    },
    phoneNumber: {
      type: DataTypes.STRING(40),
      allowNull: true,
      field: "phone_number",
    },
    role: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "employee",
    },
    workLocation: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "work_location",
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
    tableName: "User",
    timestamps: false,
  }
);

export default User;