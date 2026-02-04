import User from "./user.model.js";
import Session from "./session.model.js";  // Make sure this exists
import sequelize from "../config/sequelizeInstance.js";
import { Sequelize } from "sequelize";

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Models
db.user = User;
db.session = Session;  // Make sure this is here

export default db;