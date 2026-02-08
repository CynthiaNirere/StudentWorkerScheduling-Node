import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const Session = sequelize.define(
  "Session",
  {
    session_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    created_at: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: () => Date.now(),
    },
    is_active: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    expires_at: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
  },
  {
    tableName: "Session",
    timestamps: false,
  }
);

export default Session;