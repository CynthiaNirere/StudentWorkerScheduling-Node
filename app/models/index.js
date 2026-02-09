import User from "./user.model.js";
import Session from "./session.model.js";  
import Schedule from "./schedule.model.js";
import Availability from "./availability.model.js";
import Clock from "./clock.model.js";
import Session from "./session.model.js";  // Make sure this exists
import Coverage from "./coverage.models.js";
import Notification from "./notifications.models.js";
import Skill from "./skills.models.js";
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


db.session = Session;  // Make sure this is here
db.coverage = Coverage;
db.notification = Notification;
db.skill = Skill;// Make sure this is here
export default db;