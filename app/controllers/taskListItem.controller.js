import db from "../models/index.js";

const TaskListItem = db.taskListItem;
const TaskList = db.taskList;

// Get all task list items
export const findAll = async (req, res) => {
  try {
    const { tasklistId } = req.query;
    
    let condition = {};
    if (tasklistId) {
      condition.tasklistId = tasklistId;
    }
    
    const items = await TaskListItem.findAll({
      where: condition,
      include: [
        {
          model: TaskList,
          as: 'taskList',
          attributes: ['tasklist_id', 'title', 'description']
        }
      ],
      order: [['order', 'ASC']]
    });
    
    res.send(items);
  } catch (err) {
    console.error("Error retrieving task list items:", err);
    res.status(500).send({
      message: err.message || "Error retrieving task list items."
    });
  }
};

// Get task list items by tasklist ID
export const findByTaskList = async (req, res) => {
  try {
    const tasklistId = req.params.tasklistId;
    
    const items = await TaskListItem.findAll({
      where: { tasklistId: tasklistId },
      order: [['order', 'ASC']]
    });
    
    res.send(items);
  } catch (err) {
    console.error("Error retrieving items for task list:", err);
    res.status(500).send({
      message: err.message || "Error retrieving items."
    });
  }
};

// Get single task list item
export const findOne = async (req, res) => {
  try {
    const id = req.params.id;
    
    const item = await TaskListItem.findByPk(id, {
      include: [
        {
          model: TaskList,
          as: 'taskList',
          attributes: ['tasklist_id', 'title', 'description']
        }
      ]
    });
    
    if (!item) {
      return res.status(404).send({
        message: `Task list item not found with id=${id}`
      });
    }
    
    res.send(item);
  } catch (err) {
    console.error("Error retrieving task list item:", err);
    res.status(500).send({
      message: "Error retrieving task list item."
    });
  }
};

// Create a new task list item
export const create = async (req, res) => {
  try {
    const { tasklistId, title, description, order } = req.body;
    
    if (!tasklistId || !title) {
      return res.status(400).send({
        message: "tasklistId and title are required!"
      });
    }
    
    // If no order provided, get the max order + 1
    let itemOrder = order;
    if (!itemOrder) {
      const maxItem = await TaskListItem.findOne({
        where: { tasklistId },
        order: [['order', 'DESC']]
      });
      itemOrder = maxItem ? maxItem.order + 1 : 1;
    }
    
    const item = await TaskListItem.create({
      tasklistId,
      title,
      description: description || null,
      order: itemOrder,
      status: 'active',
      completedAt: null,
      shiftId: req.body.shiftId || null,
      assignedDate: req.body.assignedDate || null,
      createdAt: Date.now()
    });
    
    res.status(201).send(item);
  } catch (err) {
    console.error("Error creating task list item:", err);
    res.status(500).send({
      message: err.message || "Error creating task list item."
    });
  }
};

// Update a task list item
export const update = async (req, res) => {
  try {
    const id = req.params.id;
    
    const item = await TaskListItem.findByPk(id);
    if (!item) {
      return res.status(404).send({
        message: `Task list item not found with id=${id}`
      });
    }
    
    const updateData = {};
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.order !== undefined) updateData.order = req.body.order;
    if (req.body.shiftId !== undefined) updateData.shiftId = req.body.shiftId;
    if (req.body.assignedDate !== undefined) updateData.assignedDate = req.body.assignedDate;
    if (req.body.completedAt !== undefined) updateData.completedAt = req.body.completedAt;
    
    updateData.updatedAt = Date.now();
    
    await item.update(updateData);
    
    res.send({
      message: "Task list item updated successfully.",
      item
    });
  } catch (err) {
    console.error("Error updating task list item:", err);
    res.status(500).send({
      message: "Error updating task list item."
    });
  }
};

// Delete a task list item
export const remove = async (req, res) => {
  try {
    const id = req.params.id;
    
    const item = await TaskListItem.findByPk(id);
    if (!item) {
      return res.status(404).send({
        message: `Task list item not found.`
      });
    }
    
    await item.destroy();
    
    res.send({
      message: "Task list item deleted successfully."
    });
  } catch (err) {
    console.error("Error deleting task list item:", err);
    res.status(500).send({
      message: err.message || "Error deleting task list item."
    });
  }
};

// Mark item as complete
export const complete = async (req, res) => {
  try {
    const id = req.params.id;
    
    const item = await TaskListItem.findByPk(id);
    if (!item) {
      return res.status(404).send({
        message: `Task list item not found.`
      });
    }
    
    await item.update({
      status: 'completed',
      completedAt: Date.now(),
      updatedAt: Date.now()
    });
    
    res.send({
      message: "Task list item marked as complete.",
      item
    });
  } catch (err) {
    console.error("Error completing task list item:", err);
    res.status(500).send({
      message: err.message || "Error completing task list item."
    });
  }
};

// Reorder items
export const reorder = async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).send({
        message: "Items array is required!"
      });
    }
    
    // Update order for each item
    for (const itemData of items) {
      await TaskListItem.update(
        { order: itemData.order, updatedAt: Date.now() },
        { where: { item_id: itemData.item_id } }
      );
    }
    
    res.send({
      message: "Items reordered successfully."
    });
  } catch (err) {
    console.error("Error reordering items:", err);
    res.status(500).send({
      message: err.message || "Error reordering items."
    });
  }
};