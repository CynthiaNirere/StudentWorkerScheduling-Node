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
import ShiftSwapRequestUser from "./shiftSwapRequestUser.model.js";
import TimeOffRequest from "./timeOffRequest.model.js";
import BusinessArea from "./businessArea.model.js"; 
import JobRole from "./jobRole.model.js";
import Shift from "./shift.model.js";
import ScheduleTemplate from "./scheduleTemplate.model.js"; 
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
db.shiftSwapRequestUser = ShiftSwapRequestUser;
db.timeOffRequest = TimeOffRequest;
db.businessArea = BusinessArea; 
db.jobRole = JobRole; 
db.Shift = Shift;
db.scheduleTemplate = ScheduleTemplate; 

// ─── USER ASSOCIATIONS ────────────────────────────────────────────────────
User.hasMany(Session, { foreignKey: "user_id", onDelete: "CASCADE" });
Session.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(Availability, { foreignKey: "user_id", onDelete: "CASCADE" });
Availability.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(Clock, { foreignKey: "user_id", onDelete: "CASCADE" });
Clock.belongsTo(User, { foreignKey: "user_id" });

// ─── SHIFT ASSOCIATIONS ───────────────────────────────────────────────────
// IMPORTANT: Shift belongs to User (for employee assignments)
Shift.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
  constraints: false
});

User.hasMany(Shift, {
  foreignKey: 'userId',
  as: 'shifts'
});

// ─── BUSINESS AREA & JOB ROLE ASSOCIATIONS ────────────────────────────────
BusinessArea.hasMany(JobRole, {
  foreignKey: 'location_id',
  sourceKey: 'location_id',
  as: 'jobRoles'
});

JobRole.belongsTo(BusinessArea, {
  foreignKey: 'location_id',
  targetKey: 'location_id',
  as: 'location'
});

// ShiftSwapRequest associations
ShiftSwapRequest.hasOne(ShiftSwapRequestUser, { foreignKey: 'swap_id', as: 'swapUser' });
ShiftSwapRequestUser.belongsTo(ShiftSwapRequest, { foreignKey: 'swap_id' });

ShiftSwapRequest.belongsTo(Shift, { foreignKey: 'original_shift_id', targetKey: 'id', as: 'shift' });

ShiftSwapRequestUser.belongsTo(User, { foreignKey: 'requesting_user_id', targetKey: 'id', as: 'requestingUser' });
ShiftSwapRequestUser.belongsTo(User, { foreignKey: 'accepting_user_id', targetKey: 'id', as: 'acceptingUser' });

// TimeOffRequest associations
TimeOffRequest.belongsTo(User, { foreignKey: 'user_id', targetKey: 'id', as: 'employee' });

export default db;