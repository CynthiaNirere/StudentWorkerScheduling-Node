import db from "../models/index.js";

const TaskList = db.taskList;
const TaskListItem = db.taskListItem;
const TaskCompletionHistory = db.taskCompletionHistory;
const Shift = db.shift;
const { Op } = db.Sequelize;

// Create and Save a new Task List
export const create = async (req, res) => {
  try {
    console.log("Creating task list with data:", req.body);
    
    if (!req.body.title) {
      return res.status(400).send({ message: "Title is required!" });
    }
    
    // Create task list
    const taskList = await TaskList.create({
      title: req.body.title,
      description: req.body.description || null,
      createdBy: req.user.id,
      assignedTo: req.body.assignedTo || null,
      dueDate: req.body.dueDate || null,
      priority: req.body.priority || null,
      status: req.body.status || 'active',
      locationId: req.body.locationId || null,
      shiftType: req.body.shiftType || 'all_day',
      jobRoleId: req.body.jobRoleId || null,
      recursDaily: req.body.recursDaily || false,
      isTemplate: req.body.isTemplate || false,
      createdAt: Date.now(),
      updatedAt: null
    });
    
    console.log("Task list created with ID:", taskList.id);
    res.status(201).send(taskList);
    
  } catch (err) {
    console.error("Error creating task list:", err.message);
    res.status(500).send({
      message: err.message || "Error creating task list.",
      error: err.message
    });
  }
};

// Retrieve all Task Lists with optional filters
export const findAll = async (req, res) => {
  try {
    const { locationId, assignedTo, status, isTemplate } = req.query;
    
    let condition = {};
    
    if (locationId) {
      condition.locationId = locationId;
    }
    
    if (assignedTo) {
      condition.assignedTo = assignedTo;
    }
    
    if (status) {
      condition.status = status;
    }
    
    if (isTemplate !== undefined) {
      condition.isTemplate = isTemplate === 'true';
    }
    
    const taskLists = await TaskList.findAll({ where: condition });
    res.send(taskLists);
  } catch (err) {
    console.error("Error retrieving task lists:", err);
    res.status(500).send({ message: "Error retrieving task lists." });
  }
};

// ✅ NEW: Get all task templates
export const findAllTemplates = async (req, res) => {
  try {
    const { locationId, shiftType, jobRoleId } = req.query;
    
    let condition = { isTemplate: true };
    
    if (locationId) {
      condition.locationId = locationId;
    }
    
    if (shiftType) {
      condition.shiftType = shiftType;
    }
    
    if (jobRoleId) {
      condition.jobRoleId = jobRoleId;
    }
    
    const templates = await TaskList.findAll({ 
      where: condition,
      order: [['title', 'ASC']]
    });
    
    res.send(templates);
  } catch (err) {
    console.error("Error retrieving task templates:", err);
    res.status(500).send({ message: "Error retrieving task templates." });
  }
};

// ✅ NEW: Get daily task assignments for a specific date
export const findDailyAssignments = async (req, res) => {
  try {
    const { date } = req.params;
    const dateTimestamp = parseInt(date);
    
    const items = await TaskListItem.findAll({
      where: { assignedDate: dateTimestamp },
      include: [{
        model: TaskList,
        as: 'taskList'
      }],
      order: [['orderPosition', 'ASC']]
    });
    
    res.send(items);
  } catch (err) {
    console.error("Error retrieving daily assignments:", err);
    res.status(500).send({ message: "Error retrieving daily assignments." });
  }
};

// ✅ NEW: Get tasks for a specific user on a specific date
export const findUserDailyTasks = async (req, res) => {
  try {
    const { userId, date } = req.params;
    const dateTimestamp = parseInt(date);
    
    const items = await TaskListItem.findAll({
      where: { 
        assignedTo: userId,
        assignedDate: dateTimestamp
      },
      include: [{
        model: TaskList,
        as: 'taskList'
      }],
      order: [['orderPosition', 'ASC']]
    });
    
    res.send(items);
  } catch (err) {
    console.error("Error retrieving user daily tasks:", err);
    res.status(500).send({ message: "Error retrieving user daily tasks." });
  }
};

// ✅ NEW: Assign template to a specific shift
export const assignToShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { shiftId, date, userId } = req.body;
    
    if (!shiftId || !date || !userId) {
      return res.status(400).send({ message: "Shift ID, date, and user ID are required!" });
    }
    
    const template = await TaskList.findByPk(id);
    if (!template) {
      return res.status(404).send({ message: "Task template not found!" });
    }
    
    if (!template.isTemplate) {
      return res.status(400).send({ message: "This task list is not a template!" });
    }
    
    const items = await TaskListItem.findAll({ 
      where: { tasklistId: id }
    });
    
    const dateTimestamp = parseInt(date);
    
    const assignments = items.map(item => ({
      tasklistId: template.id,
      title: item.title,
      description: item.description,
      assignedTo: userId,
      status: 'pending',
      completedBy: null,
      orderPosition: item.orderPosition,
      shiftId: shiftId,
      assignedDate: dateTimestamp,
      completedAt: null,
      createdAt: Date.now(),
      updatedAt: null
    }));
    
    await TaskListItem.bulkCreate(assignments);
    
    res.send({ 
      message: "Tasks assigned to shift successfully!",
      count: assignments.length
    });
    
  } catch (err) {
    console.error("Error assigning template to shift:", err);
    res.status(500).send({ message: "Error assigning template to shift." });
  }
};

// ✅ NEW: Get completion history
export const getCompletionHistory = async (req, res) => {
  try {
    const { date, userId, taskListId } = req.query;
    
    let condition = {};
    
    if (date) {
      condition.date = parseInt(date);
    }
    
    if (userId) {
      condition.completedBy = userId;
    }
    
    if (taskListId) {
      condition.taskListId = parseInt(taskListId);
    }
    
    const history = await TaskCompletionHistory.findAll({
      where: condition,
      order: [['completedAt', 'DESC']]
    });
    
    res.send(history);
  } catch (err) {
    console.error("Error retrieving completion history:", err);
    res.status(500).send({ message: "Error retrieving completion history." });
  }
};

// Find one Task List by ID
export const findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const taskList = await TaskList.findByPk(id);
    if (!taskList)
      return res.status(404).send({ message: `Task list not found with id=${id}` });
    res.send(taskList);
  } catch (err) {
    console.error("Error retrieving task list:", err);
    res.status(500).send({ message: "Error retrieving task list." });
  }
};

// Update a Task List
export const update = async (req, res) => {
  try {
    const id = req.params.id;
    
    req.body.updatedAt = Date.now();
    
    const [updated] = await TaskList.update(req.body, { where: { id: id } });
    if (updated === 1)
      res.send({ message: "Task list updated successfully." });
    else
      res.status(404).send({ message: `Task list not found or no data changed.` });
  } catch (err) {
    console.error("Error updating task list:", err);
    res.status(500).send({ message: "Error updating task list." });
  }
};

// Delete a Task List
export const remove = async (req, res) => {
  try {
    const id = req.params.id;
    
    console.log(`Deleting task list ${id}...`);
    
    const taskList = await TaskList.findByPk(id);
    if (!taskList) {
      return res.status(404).send({ message: `Task list not found.` });
    }
    
    const deleted = await TaskList.destroy({ where: { id: id } });
    
    if (deleted) {
      console.log('Task list deleted successfully');
      return res.send({ message: "Task list deleted successfully." });
    }
    
    return res.status(404).send({ message: `Task list not found.` });
    
  } catch (err) {
    console.error('Error deleting task list:', err);
    res.status(500).send({ 
      message: err.message || "Error deleting task list." 
    });
  }
};

// Complete a Task List
export const complete = async (req, res) => {
  try {
    const id = req.params.id;
    
    const taskList = await TaskList.findByPk(id);
    if (!taskList) {
      return res.status(404).send({ message: `Task list not found.` });
    }
    
    await taskList.update({
      status: 'completed',
      updatedAt: Date.now()
    });
    
    res.send({ message: "Task list marked as completed.", taskList });
    
  } catch (err) {
    console.error('Error completing task list:', err);
    res.status(500).send({ 
      message: err.message || "Error completing task list." 
    });
  }
};

// Archive a Task List
export const archive = async (req, res) => {
  try {
    const id = req.params.id;
    
    const taskList = await TaskList.findByPk(id);
    if (!taskList) {
      return res.status(404).send({ message: `Task list not found.` });
    }
    
    await taskList.update({
      status: 'archived',
      updatedAt: Date.now()
    });
    
    res.send({ message: "Task list archived.", taskList });
    
  } catch (err) {
    console.error('Error archiving task list:', err);
    res.status(500).send({ 
      message: err.message || "Error archiving task list." 
    });
  }
};