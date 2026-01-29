import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'user_id'  
    },
    fName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'first_name'  // Maps to first_name in database
    },
    lName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'last_name'  // Maps to last_name in database
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: true, // optional if using Google login or SSO
    },
    role: {
      type: DataTypes.ENUM("admin", "employee"),
      allowNull: false,
      defaultValue: "employee",
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "users",
    timestamps: false,
  }
);

export default User;