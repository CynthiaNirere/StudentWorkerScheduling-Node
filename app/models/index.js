import User from "./user.model.js";
import Session from "./session.model.js";  
import Schedule from "./schedule.model.js";
import Availability from "./availability.model.js";
import Clock from "./clock.model.js";
import Coverage from "./coverage.models.js";
import Notification from "./notifications.models.js";
import Skill from "./skills.models.js";
import TaskListItem from "./taskListItem.model.js";
import TaskList from "./taskList.models.js";
import ShiftSwapRequest from "./shiftSwapRequest.model.js";
import TimeOffRequest from "./timeOffRequest.model.js";
import BusinessArea from "./businessArea.model.js"; 
import JobRole from "./jobRole.model.js";

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
db.coverage = Coverage;
db.notification = Notification;
db.skill = Skill;
db.taskListItem = TaskListItem;
db.taskList = TaskList;
db.shiftSwapRequest = ShiftSwapRequest;
db.timeOffRequest = TimeOffRequest;
db.businessArea = BusinessArea; 
db.jobRole = JobRole; 

// Associations
User.hasMany(Session, { foreignKey: "user_id", onDelete: "CASCADE" });
Session.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(Availability, { foreignKey: "user_id", onDelete: "CASCADE" });
Availability.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(Clock, { foreignKey: "user_id", onDelete: "CASCADE" });
Clock.belongsTo(User, { foreignKey: "user_id" });
// NEW: BusinessArea and JobRole Associations
BusinessArea.hasMany(JobRole, {
  foreignKey: 'location_id',
  sourceKey: 'location_id',
  as: 'jobRoles'
});

JobRole.belongsTo(BusinessArea, {
  foreignKey: 'location_id',
  targetKey: 'location_id',
  as: 'businessArea'
});

export default db;