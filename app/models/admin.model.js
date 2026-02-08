import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const Admin = sequelize.define(
  "Admin",
  {
    user_id: {
      type: DataTypes.STRING(255),
      primaryKey: true,
      field: 'user_id'
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
      allowNull: true,
    },
    first_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    phone_number: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    role: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "admin",
    },
    work_location: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
    tableName: "User",
    timestamps: false,
    defaultScope: {
      where: {
        role: 'admin'
      }
    }
  }
);

export default Admin;