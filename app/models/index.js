import User from "./user.model.js";
import Session from "./session.model.js";  // Make sure this exists
import Shift from "./shift.model.js";
import TimeOffRequest from "./Timeoffrequest.model.js";
import ShiftSwapRequest from "./Shiftswaprequest.model.js";
import ShiftSwapRequestUser from "./shiftSwapRequestUser.model.js";
import TaskList from "./taskList.model.js";
import TaskListItem from "./taskListItem.model.js";
import sequelize from "../config/sequelizeInstance.js";
import { Sequelize } from "sequelize";

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Models
db.user = User;
db.session = Session;  
db.shift = Shift;
db.timeOffRequest = TimeOffRequest;
db.shiftSwapRequest = ShiftSwapRequest;
db.shiftSwapRequestUser = ShiftSwapRequestUser;
db.taskList = TaskList;
db.taskListItem = TaskListItem;

export default db;