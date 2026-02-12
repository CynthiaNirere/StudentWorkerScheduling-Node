import User from "./user.model.js";
import Session from "./session.model.js";  
import Schedule from "./schedule.model.js";
import Availability from "./availability.model.js";
import Clock from "./clock.model.js";
import sequelize from "../config/sequelizeInstance.js";
import { Sequelize } from "sequelize";

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Models
db.user = User;
db.session = Session;  
db.schedule = Schedule;
db.availability = Availability;
db.clock = Clock;

// Associations
User.hasMany(Session, { foreignKey: "user_id", onDelete: "CASCADE" });
Session.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(Availability, { foreignKey: "user_id", onDelete: "CASCADE" });
Availability.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(Clock, { foreignKey: "user_id", onDelete: "CASCADE" });
Clock.belongsTo(User, { foreignKey: "user_id" });

export default db;