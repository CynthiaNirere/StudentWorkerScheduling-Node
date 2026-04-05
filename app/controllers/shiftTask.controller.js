import db from "../models/index.js";

const ShiftTask = db.shiftTask;
const Shift = db.shift;
const TaskList = db.taskList;
const TaskListItem = db.taskListItem;
const { Op } = db.Sequelize;

// ✅ Assign task list to shift
export const assignTaskToShift = async (req, res) => {
  try {
    const { shiftId, tasklistId } = req.body;
    
    if (!shiftId || !tasklistId) {
      return res.status(400).send({ message: "Shift ID and Task List ID are required!" });
    }
    
    // Check if shift exists
    const shift = await Shift.findByPk(shiftId);
    if (!shift) {
      return res.status(404).send({ message: "Shift not found!" });
    }
    
    // Check if task list exists
    const taskList = await TaskList.findByPk(tasklistId);
    if (!taskList) {
      return res.status(404).send({ message: "Task list not found!" });
    }
    
    // Check if already assigned
    const existing = await ShiftTask.findOne({
      where: { shiftId, tasklistId }
    });
    
    if (existing) {
      return res.status(400).send({ message: "Task list already assigned to this shift!" });
    }
    
    const shiftTask = await ShiftTask.create({
      shiftId,
      tasklistId,
      createdAt: Date.now()
    });
    
    res.status(201).send({
      message: "Task list assigned to shift successfully!",
      shiftTask
    });
    
  } catch (err) {
    console.error("❌ Error assigning task to shift:", err);
    res.status(500).send({ message: "Error assigning task to shift." });
  }
};

// ✅ Get all tasks for a shift
export const getShiftTasks = async (req, res) => {
  try {
    const shiftId = req.params.shiftId;
    
    const shiftTasks = await ShiftTask.findAll({
      where: { shiftId },
      include: [{
        model: TaskList,
        as: 'taskList',
        include: [{
          model: TaskListItem,
          as: 'items'
        }]
      }]
    });
    
    res.send(shiftTasks);
    
  } catch (err) {
    console.error("❌ Error retrieving shift tasks:", err);
    res.status(500).send({ message: "Error retrieving shift tasks." });
  }
};

// ✅ Get all shifts for a task list
export const getTaskShifts = async (req, res) => {
  try {
    const tasklistId = req.params.tasklistId;
    
    const shiftTasks = await ShiftTask.findAll({
      where: { tasklistId },
      include: [{
        model: Shift,
        as: 'shift'
      }]
    });
    
    res.send(shiftTasks);
    
  } catch (err) {
    console.error("❌ Error retrieving task shifts:", err);
    res.status(500).send({ message: "Error retrieving task shifts." });
  }
};

// ✅ Remove task from shift
export const removeTaskFromShift = async (req, res) => {
  try {
    const shiftId = req.params.shiftId;
    const tasklistId = req.params.tasklistId;
    
    const deleted = await ShiftTask.destroy({
      where: { shiftId, tasklistId }
    });
    
    if (deleted) {
      res.send({ message: "Task list removed from shift successfully!" });
    } else {
      res.status(404).send({ message: "Shift task assignment not found!" });
    }
    
  } catch (err) {
    console.error("❌ Error removing task from shift:", err);
    res.status(500).send({ message: "Error removing task from shift." });
  }
};

// ✅ Bulk assign multiple tasks to shift
export const bulkAssignTasks = async (req, res) => {
  try {
    const { shiftId, tasklistIds } = req.body;
    
    if (!shiftId || !Array.isArray(tasklistIds) || tasklistIds.length === 0) {
      return res.status(400).send({ message: "Shift ID and task list IDs array are required!" });
    }
    
    // Check if shift exists
    const shift = await Shift.findByPk(shiftId);
    if (!shift) {
      return res.status(404).send({ message: "Shift not found!" });
    }
    
    // Remove existing assignments
    await ShiftTask.destroy({ where: { shiftId } });
    
    // Create new assignments
    const assignments = tasklistIds.map(tasklistId => ({
      shiftId,
      tasklistId,
      createdAt: Date.now()
    }));
    
    await ShiftTask.bulkCreate(assignments);
    
    res.send({
      message: `${tasklistIds.length} task lists assigned to shift successfully!`,
      count: tasklistIds.length
    });
    
  } catch (err) {
    console.error("❌ Error bulk assigning tasks:", err);
    res.status(500).send({ message: "Error bulk assigning tasks." });
  }
};