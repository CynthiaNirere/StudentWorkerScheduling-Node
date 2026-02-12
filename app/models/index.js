import User from "./user.model.js";
import Session from "./session.model.js";  
import Schedule from "./schedule.model.js";
import Availability from "./availability.model.js";
import Clock from "./clock.model.js";
import Session from "./session.model.js";  // Make sure this exists
import Coverage from "./coverage.models.js";
import Notification from "./notifications.models.js";
import Skill from "./skills.models.js";
import TaskListItem from "./taskListItem.model.js";
import TaskList from "./taskList.model.js";
import ShiftSwapRequest from "./shiftSwapRequest.model.js";
import TimeOffRequest from "./timeOffRequest.model.js";

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
db.coverage = Coverage;
db.notification = Notification;
db.skill = Skill;// Make sure this is here
db.taskListItem = TaskListItem;
db.taskList = TaskList;
db.shiftSwapRequest = ShiftSwapRequest;
db.timeOffRequest = TimeOffRequest;

export default db;