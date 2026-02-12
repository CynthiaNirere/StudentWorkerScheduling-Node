import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const UserSkill = sequelize.define(
  "UserSkill",
  {
    userId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
      field: "user_id",
    },
    skillId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: "skill_id",
    },
    createdAt: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "created_at",
    },
  },
  {
    tableName: "UserSkill",
    timestamps: false,
  }
);

export default UserSkill;
