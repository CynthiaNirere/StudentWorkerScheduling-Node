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
import UserJobRoleModel from "./userJobRole.model.js";
import ShiftTaskModel from "./shiftTask.model.js";
import MessageModel from "./message.model.js";
import TaskCompletionHistoryModel from "./taskCompletionHistory.model.js";
import UserWorkplace from "./userWorkPlace.model.js"; // ✅ NEW
import TaskAssignmentModel from "./taskAssignment.model.js";

import sequelize from "../config/sequelizeInstance.js";
import { Sequelize } from "sequelize";

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user                  = User;
db.session               = Session;
db.schedule              = Schedule;
db.availability          = Availability;
db.clock                 = Clock;
db.coverage              = Coverage;
db.notification          = Notification;
db.skill                 = Skill;
db.taskListItem          = TaskListItem;
db.taskList              = TaskList;
db.shiftSwapRequest      = ShiftSwapRequest;
db.shiftSwapRequestUser  = ShiftSwapRequestUser;
db.timeOffRequest        = TimeOffRequest;
db.businessArea          = BusinessArea;
db.jobRole               = JobRole;
db.Shift                 = Shift;
db.scheduleTemplate      = ScheduleTemplate;
db.userWorkplace         = UserWorkplace; // ✅ NEW — enables multi-workplace login picker
db.userJobRole           = UserJobRoleModel(sequelize, Sequelize);
db.shiftTask             = ShiftTaskModel(sequelize, Sequelize);
db.message               = MessageModel(sequelize, Sequelize);
db.taskCompletionHistory = TaskCompletionHistoryModel(sequelize, Sequelize);
db.taskAssignment = TaskAssignmentModel(sequelize, Sequelize);

// ── Associations ──────────────────────────────────────────────────────────

User.hasMany(Session, { foreignKey: "user_id", onDelete: "CASCADE" });
Session.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(Availability, { foreignKey: "user_id", onDelete: "CASCADE" });
Availability.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(Clock, { foreignKey: "user_id", onDelete: "CASCADE" });
Clock.belongsTo(User, { foreignKey: "user_id" });

User.belongsTo(BusinessArea, {
  foreignKey: 'work_location',
  targetKey:  'location_id',
  as:         'workplace'
});
BusinessArea.hasMany(User, {
  foreignKey: 'work_location',
  sourceKey:  'location_id',
  as:         'employees'
});

// ✅ UserWorkplace — links a user to multiple business areas
User.hasMany(UserWorkplace, { foreignKey: 'userId', as: 'userWorkplaces' });
UserWorkplace.belongsTo(User, { foreignKey: 'userId', as: 'user' });

BusinessArea.hasMany(UserWorkplace, { foreignKey: 'locationId', as: 'workplaceUsers' });
UserWorkplace.belongsTo(BusinessArea, {
  foreignKey: 'locationId',
  targetKey:  'location_id',
  as:         'location'
});

Shift.belongsTo(User, { foreignKey: 'userId', as: 'user', constraints: false });
User.hasMany(Shift, { foreignKey: 'userId', as: 'shifts' });

BusinessArea.hasMany(JobRole, {
  foreignKey: 'location_id',
  sourceKey:  'location_id',
  as:         'jobRoles'
});
JobRole.belongsTo(BusinessArea, {
  foreignKey: 'location_id',
  targetKey:  'location_id',
  as:         'location'
});

ShiftSwapRequest.hasOne(ShiftSwapRequestUser, { foreignKey: 'swap_id', as: 'swapUser' });
ShiftSwapRequestUser.belongsTo(ShiftSwapRequest, { foreignKey: 'swap_id' });
ShiftSwapRequest.belongsTo(Shift, { foreignKey: 'original_shift_id', targetKey: 'id', as: 'shift' });
ShiftSwapRequestUser.belongsTo(User, { foreignKey: 'requesting_user_id', targetKey: 'id', as: 'requestingUser' });
ShiftSwapRequestUser.belongsTo(User, { foreignKey: 'accepting_user_id',  targetKey: 'id', as: 'acceptingUser' });

TimeOffRequest.belongsTo(User, { foreignKey: 'user_id', targetKey: 'id', as: 'employee' });

User.hasMany(db.userJobRole, { foreignKey: 'userId', as: 'jobRoles' });
db.userJobRole.belongsTo(User, { foreignKey: 'userId', as: 'user' });

JobRole.hasMany(db.userJobRole, { foreignKey: 'jobRoleId', as: 'userRoles' });
db.userJobRole.belongsTo(JobRole, { foreignKey: 'jobRoleId', as: 'jobRole' });

Shift.hasMany(db.shiftTask, { foreignKey: 'shiftId', as: 'tasks' });
db.shiftTask.belongsTo(Shift, { foreignKey: 'shiftId', as: 'shift' });

TaskList.hasMany(db.shiftTask, { foreignKey: 'tasklistId', as: 'shifts' });
db.shiftTask.belongsTo(TaskList, { foreignKey: 'tasklistId', as: 'taskList' });

User.hasMany(db.message, { foreignKey: 'senderId',    as: 'sentMessages' });
db.message.belongsTo(User, { foreignKey: 'senderId',  as: 'sender' });

User.hasMany(db.message, { foreignKey: 'recipientId',    as: 'receivedMessages' });
db.message.belongsTo(User, { foreignKey: 'recipientId',  as: 'recipient' });

db.message.hasMany(db.message, { foreignKey: 'parentMessageId', as: 'replies' });
db.message.belongsTo(db.message, { foreignKey: 'parentMessageId', as: 'parent' });

TaskList.hasMany(TaskListItem, { foreignKey: 'tasklistId', as: 'items' });
TaskListItem.belongsTo(TaskList, { foreignKey: 'tasklistId', as: 'taskList' });

TaskList.hasMany(db.taskCompletionHistory, { foreignKey: 'taskListId', as: 'completions' });
db.taskCompletionHistory.belongsTo(TaskList, { foreignKey: 'taskListId', as: 'taskList' });

TaskListItem.hasMany(db.taskCompletionHistory, { foreignKey: 'itemId', as: 'history' });
db.taskCompletionHistory.belongsTo(TaskListItem, { foreignKey: 'itemId', as: 'item' });

db.taskAssignment.belongsTo(TaskList, { foreignKey: 'tasklist_id', as: 'taskList' });
TaskList.hasMany(db.taskAssignment, { foreignKey: 'tasklist_id', as: 'assignments' });

User.hasMany(db.taskCompletionHistory, { foreignKey: 'completedBy', as: 'completedTasks' });
db.taskCompletionHistory.belongsTo(User, { foreignKey: 'completedBy', as: 'completedByUser' });

Shift.hasMany(db.taskCompletionHistory, { foreignKey: 'shiftId', as: 'taskCompletions' });
db.taskCompletionHistory.belongsTo(Shift, { foreignKey: 'shiftId', as: 'shift' });

export default db;