import db from "../models/index.js";

const TaskCompletionHistory = db.taskCompletionHistory;
const TaskList = db.taskList;
const TaskListItem = db.taskListItem;
const User = db.user;
const Shift = db.Shift;

// Get all completion history
export const findAll = async (req, res) => {
  try {
    const { taskListId, startDate, endDate, completedBy } = req.query;
    
    let condition = {};
    
    if (taskListId) {
      condition.taskListId = taskListId;
    }
    
    if (completedBy) {
      condition.completedBy = completedBy;
    }
    
    if (startDate && endDate) {
      condition.date = {
        [db.Sequelize.Op.between]: [parseInt(startDate), parseInt(endDate)]
      };
    }
    
    const history = await TaskCompletionHistory.findAll({
      where: condition,
      include: [
        {
          model: TaskList,
          as: 'taskList',
          attributes: ['tasklist_id', 'title']
        },
        {
          model: TaskListItem,
          as: 'item',
          attributes: ['item_id', 'title'],
          required: false
        },
        {
          model: User,
          as: 'completedByUser',
          attributes: ['user_id', 'first_name', 'last_name', 'email'],
          required: false
        },
        {
          model: Shift,
          as: 'shift',
          attributes: ['id', 'shift_time', 'start_time', 'end_time'],
          required: false
        }
      ],
      order: [['completedAt', 'DESC']]
    });
    
    res.send(history);
  } catch (err) {
    console.error("Error retrieving task completion history:", err);
    res.status(500).send({
      message: err.message || "Error retrieving task completion history."
    });
  }
};

// Create completion history entry
export const create = async (req, res) => {
  try {
    const {
      taskListId,
      itemId,
      completedBy,
      shiftId,
      date,
      notes
    } = req.body;
    
    if (!taskListId || !completedBy || !date) {
      return res.status(400).send({
        message: "taskListId, completedBy, and date are required!"
      });
    }
    
    const history = await TaskCompletionHistory.create({
      taskListId,
      itemId: itemId || null,
      completedBy,
      completedAt: Date.now(),
      shiftId: shiftId || null,
      date,
      notes: notes || null,
      createdAt: Date.now()
    });
    
    res.status(201).send(history);
  } catch (err) {
    console.error("Error creating task completion history:", err);
    res.status(500).send({
      message: err.message || "Error creating task completion history."
    });
  }
};

// Get completion history by date range
export const findByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.params;
    
    const history = await TaskCompletionHistory.findAll({
      where: {
        date: {
          [db.Sequelize.Op.between]: [parseInt(startDate), parseInt(endDate)]
        }
      },
      include: [
        {
          model: TaskList,
          as: 'taskList',
          attributes: ['tasklist_id', 'title']
        },
        {
          model: TaskListItem,
          as: 'item',
          attributes: ['item_id', 'title'],
          required: false
        }
      ],
      order: [['date', 'ASC'], ['completedAt', 'ASC']]
    });
    
    res.send(history);
  } catch (err) {
    console.error("Error retrieving completion history by date:", err);
    res.status(500).send({
      message: err.message || "Error retrieving completion history."
    });
  }
};

// Get completion stats for yesterday
export const getYesterdayStats = async (req, res) => {
  try {
    // Calculate yesterday's date range (midnight to midnight)
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const yesterdayStart = yesterday.getTime();
    
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);
    const yesterdayEndTime = yesterdayEnd.getTime();
    
    // Get all completions from yesterday
    const completions = await TaskCompletionHistory.findAll({
      where: {
        date: {
          [db.Sequelize.Op.between]: [yesterdayStart, yesterdayEndTime]
        }
      }
    });
    
    // Get all task items that were assigned for yesterday
    const assignedTasks = await TaskListItem.findAll({
      where: {
        assignedDate: {
          [db.Sequelize.Op.between]: [yesterdayStart, yesterdayEndTime]
        }
      }
    });
    
    const totalTasks = assignedTasks.length;
    const completedTasks = completions.length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    res.send({
      date: yesterdayStart,
      totalTasks,
      completedTasks,
      completionRate: Math.round(completionRate),
      completions
    });
  } catch (err) {
    console.error("Error retrieving yesterday's stats:", err);
    res.status(500).send({
      message: err.message || "Error retrieving statistics."
    });
  }
};