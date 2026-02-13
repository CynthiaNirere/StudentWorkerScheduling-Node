import db from "../models/index.js";

const TaskList = db.taskList;
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
      createdBy: req.user.id, // From authentication middleware
      assignedTo: req.body.assignedTo || null,
      dueDate: req.body.dueDate || null,
      priority: req.body.priority || null,
      status: req.body.status || 'active',
      locationId: req.body.locationId || null,
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
    const { locationId, assignedTo, status } = req.query;
    
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
    
    const taskLists = await TaskList.findAll({ where: condition });
    res.send(taskLists);
  } catch (err) {
    console.error("Error retrieving task lists:", err);
    res.status(500).send({ message: "Error retrieving task lists." });
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
    
    // Add updated timestamp
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
    
    // Note: TaskListItems will be deleted automatically due to CASCADE
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