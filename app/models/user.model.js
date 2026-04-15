import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";
//
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
      validate: {
        isEmail: true,
      },
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
    phone_number: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    role: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "employee",
    },
    job_role: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    work_location: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "created_at",
      defaultValue: () => Date.now(),
    },
    updatedAt: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: "updated_at",
    },
    certifications: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      get() {
        const raw = this.getDataValue('certifications');
        try { return raw ? JSON.parse(raw) : []; } catch { return []; }
      },
      set(value) {
        this.setDataValue('certifications', JSON.stringify(value || []));
      },
    },
  },
  {
    tableName: "User",
    timestamps: false,
  }
);

export default User;