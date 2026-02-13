import db from "../models/index.js";

const TaskListItem = db.taskListItem;
const { Op } = db.Sequelize;

// Create and Save a new Task List Item
export const create = async (req, res) => {
  try {
    console.log("Creating task list item with data:", req.body);
    
    if (!req.body.title || !req.body.tasklistId) {
      return res.status(400).send({ message: "Title and task list ID are required!" });
    }
    
    // Create task list item
    const item = await TaskListItem.create({
      tasklistId: req.body.tasklistId,
      title: req.body.title,
      description: req.body.description || null,
      assignedTo: req.body.assignedTo || null,
      status: req.body.status || 'pending',
      completedBy: null,
      orderPosition: req.body.orderPosition || null,
      createdAt: Date.now(),
      updatedAt: null
    });
    
    console.log("Task list item created with ID:", item.id);
    res.status(201).send(item);
    
  } catch (err) {
    console.error("Error creating task list item:", err.message);
    res.status(500).send({
      message: err.message || "Error creating task list item.",
      error: err.message
    });
  }
};

// Retrieve all Task List Items with optional filters
export const findAll = async (req, res) => {
  try {
    const { tasklistId, assignedTo, status } = req.query;
    
    let condition = {};
    
    if (tasklistId) {
      condition.tasklistId = tasklistId;
    }
    
    if (assignedTo) {
      condition.assignedTo = assignedTo;
    }
    
    if (status) {
      condition.status = status;
    }
    
    const items = await TaskListItem.findAll({ 
      where: condition,
      order: [['orderPosition', 'ASC']]
    });
    res.send(items);
  } catch (err) {
    console.error("Error retrieving task list items:", err);
    res.status(500).send({ message: "Error retrieving task list items." });
  }
};

// Find one Task List Item by ID
export const findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const item = await TaskListItem.findByPk(id);
    if (!item)
      return res.status(404).send({ message: `Task list item not found with id=${id}` });
    res.send(item);
  } catch (err) {
    console.error("Error retrieving task list item:", err);
    res.status(500).send({ message: "Error retrieving task list item." });
  }
};

// Update a Task List Item
export const update = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Add updated timestamp
    req.body.updatedAt = Date.now();
    
    const [updated] = await TaskListItem.update(req.body, { where: { id: id } });
    if (updated === 1)
      res.send({ message: "Task list item updated successfully." });
    else
      res.status(404).send({ message: `Task list item not found or no data changed.` });
  } catch (err) {
    console.error("Error updating task list item:", err);
    res.status(500).send({ message: "Error updating task list item." });
  }
};

// Delete a Task List Item
export const remove = async (req, res) => {
  try {
    const id = req.params.id;
    
    console.log(`Deleting task list item ${id}...`);
    
    const item = await TaskListItem.findByPk(id);
    if (!item) {
      return res.status(404).send({ message: `Task list item not found.` });
    }
    
    const deleted = await TaskListItem.destroy({ where: { id: id } });
    
    if (deleted) {
      console.log('Task list item deleted successfully');
      return res.send({ message: "Task list item deleted successfully." });
    }
    
    return res.status(404).send({ message: `Task list item not found.` });
    
  } catch (err) {
    console.error('Error deleting task list item:', err);
    res.status(500).send({ 
      message: err.message || "Error deleting task list item." 
    });
  }
};

// Complete a Task List Item
export const complete = async (req, res) => {
  try {
    const id = req.params.id;
    
    const item = await TaskListItem.findByPk(id);
    if (!item) {
      return res.status(404).send({ message: `Task list item not found.` });
    }
    
    await item.update({
      status: 'completed',
      completedBy: req.user.id,
      updatedAt: Date.now()
    });
    
    res.send({ message: "Task list item marked as completed.", item });
    
  } catch (err) {
    console.error('Error completing task list item:', err);
    res.status(500).send({ 
      message: err.message || "Error completing task list item." 
    });
  }
};

// Reorder Task List Items
export const reorder = async (req, res) => {
  try {
    const { items } = req.body; // Array of { id, orderPosition }
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).send({ message: "Items array is required!" });
    }
    
    // Update each item's order position
    const updatePromises = items.map(item => 
      TaskListItem.update(
        { orderPosition: item.orderPosition, updatedAt: Date.now() },
        { where: { id: item.id } }
      )
    );
    
    await Promise.all(updatePromises);
    
    res.send({ message: "Task list items reordered successfully." });
    
  } catch (err) {
    console.error('Error reordering task list items:', err);
    res.status(500).send({ 
      message: err.message || "Error reordering task list items." 
    });
  }
};

// Get all items for a specific task list
export const findByTaskList = async (req, res) => {
  try {
    const tasklistId = req.params.tasklistId;
    
    const items = await TaskListItem.findAll({ 
      where: { tasklistId: tasklistId },
      order: [['orderPosition', 'ASC']]
    });
    
    res.send(items);
  } catch (err) {
    console.error("Error retrieving task list items:", err);
    res.status(500).send({ message: "Error retrieving task list items." });
  }
};