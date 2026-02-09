import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const Skill = sequelize.define(
  "Skill",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "skill_id",
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "created_at",
    },
  },
  {
    tableName: "skills",
    timestamps: false,
  }
);

export default Skill;