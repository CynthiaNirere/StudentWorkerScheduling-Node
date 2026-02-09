import User from "./user.model.js";
import Session from "./session.model.js";  // Make sure this exists
import Coverage from "./coverage.models.js";
import sequelize from "../config/sequelizeInstance.js";
import admin from "./admin.model.js";
import { Sequelize } from "sequelize";

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Models
db.user = User;
db.session = Session;  // Make sure this is here
db.coverage = Coverage;
db.admin = admin;
export default db;