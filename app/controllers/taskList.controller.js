import db from "../models/index.js";

const TaskList     = db.taskList;
const TaskListItem = db.taskListItem;
const TaskCompletionHistory = db.taskCompletionHistory;
const { Op } = db.Sequelize;

// ── Helper ────────────────────────────────────────────────────────────────
const getUserId = (req) => req.user?.userId || req.user?.user_id || req.user?.id;

// ── CREATE ────────────────────────────────────────────────────────────────
export const create = async (req, res) => {
  try {
    if (!req.body.title) return res.status(400) .send({ message: "Title is required!" });

    // Accept both camelCase and snake_case from frontend
    const taskList = await TaskList.create({
      title:       req.body.title,
      description: req.body.description || null,
      createdBy:   req.body.createdBy   || req.body.created_by  || getUserId(req),
      assignedTo:  req.body.assignedTo  || req.body.assigned_to || null,
      dueDate:     req.body.dueDate     || req.body.due_date    || null,
      priority:    req.body.priority    || 'medium',
      status:      req.body.status      || 'active',
      locationId:  req.body.locationId  || req.body.location_id || req.workLocation || null,
      shiftType:   req.body.shiftType   || req.body.shift_type  || 'all_day',
      jobRoleId:   req.body.jobRoleId   || req.body.job_role_id || null,
      recursDaily: req.body.recursDaily ?? req.body.recurs_daily ?? false,
      isTemplate:  req.body.isTemplate  ?? req.body.is_template  ?? false,
      createdAt:   Date.now(),
      updatedAt:   null,
    });

    res.status(201).send(taskList);
  } catch (err) {
    console.error("Error creating task list:", err.message);
    res.status(500).send({ message: err.message || "Error creating task list." });
  }
};

// ── FIND ALL (scoped by workplace) ────────────────────────────────────────
export const findAll = async (req, res) => {
  try {
    const condition = {};

    // Scope by location — employers only see their workplace
    const locationId = req.query.locationId || req.query.location_id;
    if (locationId) {
      condition.locationId = locationId;
    } else if (req.workLocation && req.userRole !== 'admin') {
      condition.locationId = req.workLocation;
    }

    if (req.query.assignedTo) condition.assignedTo = req.query.assignedTo;
    if (req.query.status)     condition.status     = req.query.status;
    if (req.query.isTemplate !== undefined) {
      condition.isTemplate = req.query.isTemplate === 'true';
    }

    const taskLists = await TaskList.findAll({ where: condition });
    res.send(taskLists);
  } catch (err) {
    console.error("Error retrieving task lists:", err);
    res.status(500).send({ message: "Error retrieving task lists." });
  }
};

// ── FIND ALL TEMPLATES ────────────────────────────────────────────────────
export const findAllTemplates = async (req, res) => {
  try {
    const condition = { isTemplate: true };
    if (req.query.locationId) condition.locationId = req.query.locationId;
    if (req.query.shiftType)  condition.shiftType  = req.query.shiftType;
    if (req.query.jobRoleId)  condition.jobRoleId  = req.query.jobRoleId;

    const templates = await TaskList.findAll({
      where: condition,
      order: [['title', 'ASC']],
    });
    res.send(templates);
  } catch (err) {
    console.error("Error retrieving task templates:", err);
    res.status(500).send({ message: "Error retrieving task templates." });
  }
};

// ── FIND ONE ──────────────────────────────────────────────────────────────
export const findOne = async (req, res) => {
  try {
    const taskList = await TaskList.findByPk(req.params.id);
    if (!taskList) return res.status(404).send({ message: `Task list not found with id=${req.params.id}` });
    res.send(taskList);
  } catch (err) {
    console.error("Error retrieving task list:", err);
    res.status(500).send({ message: "Error retrieving task list." });
  }
};

// ── FIND DAILY ASSIGNMENTS ────────────────────────────────────────────────
export const findDailyAssignments = async (req, res) => {
  try {
    const items = await TaskListItem.findAll({
      where: { assignedDate: parseInt(req.params.date) },
      include: [{ model: TaskList, as: 'taskList' }],
      order: [['orderPosition', 'ASC']],
    });
    res.send(items);
  } catch (err) {
    console.error("Error retrieving daily assignments:", err);
    res.status(500).send({ message: "Error retrieving daily assignments." });
  }
};

// ── FIND USER DAILY TASKS ─────────────────────────────────────────────────
export const findUserDailyTasks = async (req, res) => {
  try {
    const items = await TaskListItem.findAll({
      where: { assignedTo: req.params.userId, assignedDate: parseInt(req.params.date) },
      include: [{ model: TaskList, as: 'taskList' }],
      order: [['orderPosition', 'ASC']],
    });
    res.send(items);
  } catch (err) {
    console.error("Error retrieving user daily tasks:", err);
    res.status(500).send({ message: "Error retrieving user daily tasks." });
  }
};

// ── ASSIGN TEMPLATE TO SHIFT ──────────────────────────────────────────────
export const assignToShift = async (req, res) => {
  try {
    const { shiftId, date, userId } = req.body;
    if (!shiftId || !date || !userId)
      return res.status(400).send({ message: "shiftId, date, and userId are required." });

    const template = await TaskList.findByPk(req.params.id);
    if (!template)         return res.status(404).send({ message: "Task template not found." });
    if (!template.isTemplate) return res.status(400).send({ message: "This task list is not a template." });

    const items = await TaskListItem.findAll({ where: { tasklistId: template.id } });

    const assignments = items.map(item => ({
      tasklistId:    template.id,
      title:         item.title,
      description:   item.description,
      assignedTo:    userId,
      status:        'active',
      orderPosition: item.orderPosition,
      shiftId,
      assignedDate:  parseInt(date),
      completedAt:   null,
      createdAt:     Date.now(),
      updatedAt:     null,
    }));

    await TaskListItem.bulkCreate(assignments);

    res.send({ message: "Tasks assigned to shift successfully!", count: assignments.length });
  } catch (err) {
    console.error("Error assigning template to shift:", err);
    res.status(500).send({ message: "Error assigning template to shift." });
  }
};

// ── GET COMPLETION HISTORY ────────────────────────────────────────────────
export const getCompletionHistory = async (req, res) => {
  try {
    const condition = {};
    if (req.query.date)       condition.date        = parseInt(req.query.date);
    if (req.query.userId)     condition.completedBy = req.query.userId;
    if (req.query.taskListId) condition.taskListId  = parseInt(req.query.taskListId);

    const history = await TaskCompletionHistory.findAll({
      where: condition,
      order: [['completedAt', 'DESC']],
    });
    res.send(history);
  } catch (err) {
    console.error("Error retrieving completion history:", err);
    res.status(500).send({ message: "Error retrieving completion history." });
  }
};

// ── UPDATE ────────────────────────────────────────────────────────────────
export const update = async (req, res) => {
  try {
    req.body.updatedAt = Date.now();
    const [updated] = await TaskList.update(req.body, { where: { id: req.params.id } });
    if (updated === 1) res.send({ message: "Task list updated successfully." });
    else res.status(404).send({ message: "Task list not found or no data changed." });
  } catch (err) {
    console.error("Error updating task list:", err);
    res.status(500).send({ message: "Error updating task list." });
  }
};

// ── DELETE ────────────────────────────────────────────────────────────────
export const remove = async (req, res) => {
  try {
    const deleted = await TaskList.destroy({ where: { id: req.params.id } });
    if (deleted) return res.send({ message: "Task list deleted successfully." });
    return res.status(404).send({ message: "Task list not found." });
  } catch (err) {
    console.error("Error deleting task list:", err);
    res.status(500).send({ message: err.message || "Error deleting task list." });
  }
};

// ── COMPLETE ──────────────────────────────────────────────────────────────
export const complete = async (req, res) => {
  try {
    const taskList = await TaskList.findByPk(req.params.id);
    if (!taskList) return res.status(404).send({ message: "Task list not found." });
    await taskList.update({ status: 'completed', updatedAt: Date.now() });
    res.send({ message: "Task list marked as completed.", taskList });
  } catch (err) {
    console.error("Error completing task list:", err);
    res.status(500).send({ message: err.message || "Error completing task list." });
  }
};

// ── ARCHIVE ───────────────────────────────────────────────────────────────
export const archive = async (req, res) => {
  try {
    const taskList = await TaskList.findByPk(req.params.id);
    if (!taskList) return res.status(404).send({ message: "Task list not found." });
    await taskList.update({ status: 'archived', updatedAt: Date.now() });
    res.send({ message: "Task list archived.", taskList });
  } catch (err) {
    console.error("Error archiving task list:", err);
    res.status(500).send({ message: err.message || "Error archiving task list." });
  }
};