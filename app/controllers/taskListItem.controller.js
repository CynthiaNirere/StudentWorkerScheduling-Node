import db from "../models/index.js";

const TaskListItem = db.taskListItem;
const TaskList     = db.taskList;

// ── GET ALL (optionally filtered by tasklistId) ───────────────────────────
export const findAll = async (req, res) => {
  try {
    const condition = {};
    if (req.query.tasklistId || req.query.tasklist_id) {
      condition.tasklistId = req.query.tasklistId || req.query.tasklist_id;
    }

    const items = await TaskListItem.findAll({
      where: condition,
      include: [{
        model: TaskList,
        as: 'taskList',
        attributes: ['id', 'tasklist_id', 'title', 'description'],
        required: false,
      }],
      order: [['orderPosition', 'ASC']],  // ✅ maps to order_position column
    });

    res.send(items);
  } catch (err) {
    console.error("Error retrieving task list items:", err);
    res.status(500).send({ message: "Error retrieving task list items." });
  }
};

// ── GET BY TASKLIST ID ────────────────────────────────────────────────────
export const findByTaskList = async (req, res) => {
  try {
    const tasklistId = req.params.tasklistId || req.params.id;

    const items = await TaskListItem.findAll({
      where: { tasklistId },
      order: [['orderPosition', 'ASC']],  // ✅ fixed
    });

    res.send(items);
  } catch (err) {
    console.error("Error retrieving items for task list:", err);
    res.status(500).send({ message: "Error retrieving task list items." });
  }
};

// ── GET ONE ───────────────────────────────────────────────────────────────
export const findOne = async (req, res) => {
  try {
    const item = await TaskListItem.findByPk(req.params.id, {
      include: [{
        model: TaskList,
        as: 'taskList',
        attributes: ['id', 'tasklist_id', 'title', 'description'],
        required: false,
      }],
    });
    if (!item) return res.status(404).send({ message: "Task item not found." });
    res.send(item);
  } catch (err) {
    console.error("Error retrieving task item:", err);
    res.status(500).send({ message: "Error retrieving task item." });
  }
};

// ── CREATE ────────────────────────────────────────────────────────────────
export const create = async (req, res) => {
  try {
    const {
      tasklistId, tasklist_id,
      title, description,
      assignedTo, assigned_to,
      status,
      orderPosition, order_position,
      shiftId, shift_id,
      assignedDate, assigned_date,
    } = req.body;

    const listId = tasklistId || tasklist_id;
    if (!listId) return res.status(400).send({ message: "tasklistId is required." });
    if (!title)  return res.status(400).send({ message: "title is required." });

    // Auto-position: place at end if not provided
    let pos = orderPosition || order_position;
    if (!pos) {
      const last = await TaskListItem.findOne({
        where: { tasklistId: listId },
        order: [['orderPosition', 'DESC']],  // ✅ fixed
      });
      pos = last ? (last.orderPosition || 0) + 1 : 1;
    }

    const item = await TaskListItem.create({
      tasklistId:    listId,
      title,
      description:   description  || null,
      assignedTo:    assignedTo   || assigned_to   || null,
      status:        status       || 'active',
      orderPosition: pos,
      shiftId:       shiftId      || shift_id      || null,
      assignedDate:  assignedDate || assigned_date || null,
      completedAt:   null,
      createdAt:     Date.now(),
      updatedAt:     null,
    });

    res.status(201).send(item);
  } catch (err) {
    console.error("Error creating task item:", err);
    res.status(500).send({ message: "Error creating task item." });
  }
};

// ── UPDATE ────────────────────────────────────────────────────────────────
export const update = async (req, res) => {
  try {
    const item = await TaskListItem.findByPk(req.params.id);
    if (!item) return res.status(404).send({ message: "Task item not found." });

    const allowed = ['title','description','status','completedBy','completedAt',
                     'assignedTo','orderPosition','shiftId','assignedDate'];
    const data = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
    data.updatedAt = Date.now();

    await item.update(data);
    res.send(item);
  } catch (err) {
    console.error("Error updating task item:", err);
    res.status(500).send({ message: "Error updating task item." });
  }
};

// ── COMPLETE ──────────────────────────────────────────────────────────────
export const complete = async (req, res) => {
  try {
    const item = await TaskListItem.findByPk(req.params.id);
    if (!item) return res.status(404).send({ message: "Task item not found." });

    const completedBy = req.user?.userId || req.user?.user_id || req.user?.id;
    await item.update({
      status: 'completed',
      completedBy,
      completedAt: Date.now(),
      updatedAt:   Date.now(),
    });

    res.send(item);
  } catch (err) {
    console.error("Error completing task item:", err);
    res.status(500).send({ message: "Error completing task item." });
  }
};

// ── REORDER ───────────────────────────────────────────────────────────────
export const reorder = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).send({ message: "items array is required." });

    for (const { item_id, orderPosition } of items) {
      await TaskListItem.update(
        { orderPosition, updatedAt: Date.now() },
        { where: { id: item_id } }
      );
    }

    res.send({ message: "Items reordered successfully." });
  } catch (err) {
    console.error("Error reordering items:", err);
    res.status(500).send({ message: "Error reordering items." });
  }
};

// ── DELETE ────────────────────────────────────────────────────────────────
export const remove = async (req, res) => {
  try {
    const deleted = await TaskListItem.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).send({ message: "Task item not found." });
    res.send({ message: "Task item deleted successfully." });
  } catch (err) {
    console.error("Error deleting task item:", err);
    res.status(500).send({ message: "Error deleting task item." });
  }
};