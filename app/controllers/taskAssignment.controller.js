import db from "../models/index.js";

const TaskAssignment = db.taskAssignment;
const TaskList = db.taskList;

const getEmployeeId = (req) => req.user?.userId || req.user?.user_id || req.user?.id;

const todayRange = () => {
  const start = new Date(); start.setHours(0,0,0,0);
  const end   = new Date(); end.setHours(23,59,59,999);
  return { start: start.getTime(), end: end.getTime() };
};

// Employee: my assigned task lists (all, filtered by date on frontend)
export const getMyAssignedTaskLists = async (req, res) => {
  try {
    const employeeId = getEmployeeId(req);
    const assignments = await TaskAssignment.findAll({
      where: { employee_id: employeeId },
      include: [{ model: TaskList, as: 'taskList' }],
    });
    const result = assignments.map(a => ({
      ...a.taskList?.dataValues,
      assignment_id:     a.assignment_id,
      shift_id:          a.shift_id,
      assigned_date:     a.assigned_date,
      assignment_status: a.status,
    }));
    res.send(result);
  } catch (err) {
    console.error("Error fetching assigned task lists:", err);
    res.status(500).send({ message: err.message });
  }
};

// Employee: today only
export const getMyToday = async (req, res) => {
  try {
    const employeeId = getEmployeeId(req);
    const { start, end } = todayRange();
    const assignments = await TaskAssignment.findAll({
      where: { employee_id: employeeId, assigned_date: { [db.Sequelize.Op.between]: [start, end] } },
      include: [{ model: TaskList, as: 'taskList' }],
    });
    const result = assignments.map(a => ({
      ...a.taskList?.dataValues,
      assignment_id:     a.assignment_id,
      shift_id:          a.shift_id,
      assigned_date:     a.assigned_date,
      assignment_status: a.status,
    }));
    res.send(result);
  } catch (err) {
    console.error("Error fetching today tasks:", err);
    res.status(500).send({ message: err.message });
  }
};

// Employer: audit yesterday
export const getYesterdayAudit = async (req, res) => {
  try {
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const start = new Date(yesterday); start.setHours(0,0,0,0);
    const end   = new Date(yesterday); end.setHours(23,59,59,999);
    const assignments = await TaskAssignment.findAll({
      where: { assigned_date: { [db.Sequelize.Op.between]: [start.getTime(), end.getTime()] } },
      include: [{ model: TaskList, as: 'taskList' }],
    });
    res.send(assignments);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Employer: today all employees
export const getToday = async (req, res) => {
  try {
    const { start, end } = todayRange();
    const assignments = await TaskAssignment.findAll({
      where: { assigned_date: { [db.Sequelize.Op.between]: [start, end] } },
      include: [{ model: TaskList, as: 'taskList' }],
    });
    res.send(assignments);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Employer: by specific date
export const getByDate = async (req, res) => {
  try {
    const ts    = parseInt(req.params.timestamp);
    const start = new Date(ts); start.setHours(0,0,0,0);
    const end   = new Date(ts); end.setHours(23,59,59,999);
    const assignments = await TaskAssignment.findAll({
      where: { assigned_date: { [db.Sequelize.Op.between]: [start.getTime(), end.getTime()] } },
      include: [{ model: TaskList, as: 'taskList' }],
    });
    res.send(assignments);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const assignment = await TaskAssignment.create({
      ...req.body,
      created_at: Date.now(),
    });
    res.status(201).send(assignment);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const bulkCreate = async (req, res) => {
  try {
    const assignments = req.body.map(a => ({ ...a, created_at: Date.now() }));
    const result = await TaskAssignment.bulkCreate(assignments);
    res.status(201).send(result);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const deleted = await TaskAssignment.destroy({ where: { assignment_id: req.params.id } });
    if (deleted) return res.send({ message: "Assignment deleted." });
    res.status(404).send({ message: "Assignment not found." });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};