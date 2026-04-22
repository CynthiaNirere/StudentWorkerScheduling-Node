import db from "../models/index.js";

const TaskAssignment = db.taskAssignment;
const TaskList       = db.taskList;
const TaskListItem   = db.taskListItem;
const User           = db.user;
const { Op }         = db.Sequelize;

const getUserId = (req) =>
  req.user?.userId || req.user?.user_id || req.user?.id;

// ── Helpers ───────────────────────────────────────────────────────────────
const dayBounds = (unixMs) => {
  const d = new Date(Number(unixMs));
  d.setHours(0, 0, 0, 0);
  const start = d.getTime();
  d.setHours(23, 59, 59, 999);
  return { start, end: d.getTime() };
};

const todayBounds = () => dayBounds(Date.now());

const yesterdayBounds = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  return dayBounds(d.getTime());
};

// ── CREATE ASSIGNMENT ─────────────────────────────────────────────────────
// POST /api/task-assignments
// Body: { tasklistId, employeeId, shiftId?, assignedDate? }
export const create = async (req, res) => {
  try {
    const { tasklistId, employeeId, shiftId, assignedDate } = req.body;

    if (!tasklistId || !employeeId) {
      return res.status(400).send({ message: "tasklistId and employeeId are required." });
    }

    const { start } = dayBounds(assignedDate || Date.now());

    // Avoid duplicate assignments for same employee + tasklist + day
    const existing = await TaskAssignment.findOne({
      where: {
        tasklistId,
        employeeId,
        assignedDate: { [Op.between]: [start, start + 86399999] },
      },
    });
    if (existing) {
      return res.status(409).send({ message: "Employee already assigned this task list for that day." });
    }

    const assignment = await TaskAssignment.create({
      tasklistId,
      employeeId,
      shiftId:      shiftId      || null,
      assignedDate: start,
      assignedBy:   getUserId(req),
      status:       "active",
      createdAt:    Date.now(),
    });

    res.status(201).send(assignment);
  } catch (err) {
    console.error("Error creating task assignment:", err);
    res.status(500).send({ message: err.message || "Error creating task assignment." });
  }
};

// ── BULK ASSIGN (assign one tasklist to multiple employees at once) ────────
// POST /api/task-assignments/bulk
// Body: { tasklistId, employeeIds: [], shiftId?, assignedDate? }
export const bulkCreate = async (req, res) => {
  try {
    const { tasklistId, employeeIds, shiftId, assignedDate } = req.body;

    if (!tasklistId || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).send({ message: "tasklistId and employeeIds[] are required." });
    }

    const { start } = dayBounds(assignedDate || Date.now());
    const assignedBy = getUserId(req);
    const now = Date.now();

    const rows = employeeIds.map(empId => ({
      tasklistId,
      employeeId:   String(empId),
      shiftId:      shiftId || null,
      assignedDate: start,
      assignedBy,
      status:       "active",
      createdAt:    now,
    }));

    // Use ignoreDuplicates so re-assigning doesn't explode
    await TaskAssignment.bulkCreate(rows, { ignoreDuplicates: true });

    res.status(201).send({ message: `Assigned to ${employeeIds.length} employee(s).`, count: employeeIds.length });
  } catch (err) {
    console.error("Error bulk assigning tasks:", err);
    res.status(500).send({ message: err.message || "Error bulk assigning tasks." });
  }
};

// ── GET MY ASSIGNMENTS FOR TODAY ──────────────────────────────────────────
// GET /api/task-assignments/my-today
// Used by the employee tasks page — returns ONLY what was assigned to them today
export const getMyToday = async (req, res) => {
  try {
    const employeeId = getUserId(req);
    const { start, end } = todayBounds();

    const assignments = await TaskAssignment.findAll({
      where: {
        employeeId,
        assignedDate: { [Op.between]: [start, end] },
        status: { [Op.ne]: "skipped" },
      },
      include: [
        {
          model:    TaskList,
          as:       "taskList",
          required: true,
        },
      ],
    });

    // Flatten: return the tasklists with the assignment_id attached
    const result = assignments.map(a => ({
      assignment_id: a.id,
      shift_id:      a.shiftId,
      assigned_date: a.assignedDate,
      ...a.taskList.toJSON(),
    }));

    res.send(result);
  } catch (err) {
    console.error("Error fetching my today tasks:", err);
    res.status(500).send({ message: err.message || "Error fetching today's tasks." });
  }
};

// ── GET ALL ASSIGNMENTS FOR TODAY (employer view) ─────────────────────────
// GET /api/task-assignments/today
export const getToday = async (req, res) => {
  try {
    const { start, end } = todayBounds();

    const assignments = await TaskAssignment.findAll({
      where: { assignedDate: { [Op.between]: [start, end] } },
      include: [
        { model: TaskList, as: "taskList", required: true },
      ],
    });

    res.send(assignments);
  } catch (err) {
    console.error("Error fetching today assignments:", err);
    res.status(500).send({ message: err.message || "Error fetching today's assignments." });
  }
};

// ── YESTERDAY AUDIT ───────────────────────────────────────────────────────
// GET /api/task-assignments/yesterday
// Returns each assignment + each item's completion status + who completed it
export const getYesterdayAudit = async (req, res) => {
  try {
    const { start, end } = yesterdayBounds();

    const assignments = await TaskAssignment.findAll({
      where: { assignedDate: { [Op.between]: [start, end] } },
      include: [
        {
          model:    TaskList,
          as:       "taskList",
          required: true,
          include:  [
            {
              model:    TaskListItem,
              as:       "items",
              required: false,
            },
          ],
        },
      ],
      order: [["employeeId", "ASC"]],
    });

    // Enrich with employee names — fetch all user IDs involved
    const employeeIds = [...new Set(assignments.map(a => a.employeeId))];

    let userMap = {};
    try {
      const users = await User.findAll({
        where: { [db.Sequelize.Op.or]: [
          { user_id: employeeIds },
          { userId:  employeeIds },
        ]},
        attributes: ["user_id", "userId", "first_name", "last_name", "fName", "lName"],
      });
      users.forEach(u => {
        const id = u.user_id || u.userId;
        const name = `${u.first_name || u.fName || ""} ${u.last_name || u.lName || ""}`.trim();
        userMap[id] = name || id;
      });
    } catch (_) {
      // If user lookup fails, IDs will show instead of names — not fatal
    }

    const result = assignments.map(a => {
      const tl    = a.taskList.toJSON();
      const items = (tl.items || []).map(item => ({
        item_id:      item.item_id || item.id,
        title:        item.title,
        status:       item.status,
        completed_by: item.completedBy || item.completed_by,
        completed_by_name: userMap[item.completedBy || item.completed_by] || null,
        completed_at: item.completedAt || item.completed_at,
      }));

      const totalItems     = items.length;
      const completedItems = items.filter(i => i.status === "completed").length;

      return {
        assignment_id:  a.id,
        employee_id:    a.employeeId,
        employee_name:  userMap[a.employeeId] || a.employeeId,
        shift_id:       a.shiftId,
        assigned_date:  a.assignedDate,
        tasklist_id:    tl.tasklist_id || tl.id,
        tasklist_title: tl.title,
        priority:       tl.priority,
        total_items:    totalItems,
        completed_items: completedItems,
        completion_pct: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
        items,
      };
    });

    res.send(result);
  } catch (err) {
    console.error("Error fetching yesterday audit:", err);
    res.status(500).send({ message: err.message || "Error fetching yesterday's audit." });
  }
};

// ── GET ASSIGNMENTS FOR A SPECIFIC DATE ───────────────────────────────────
// GET /api/task-assignments/date/:timestamp
export const getByDate = async (req, res) => {
  try {
    const { start, end } = dayBounds(req.params.timestamp);

    const assignments = await TaskAssignment.findAll({
      where: { assignedDate: { [Op.between]: [start, end] } },
      include: [{ model: TaskList, as: "taskList", required: true }],
    });

    res.send(assignments);
  } catch (err) {
    console.error("Error fetching assignments by date:", err);
    res.status(500).send({ message: err.message || "Error fetching assignments." });
  }
};

// ── DELETE ASSIGNMENT ─────────────────────────────────────────────────────
// DELETE /api/task-assignments/:id
export const remove = async (req, res) => {
  try {
    const deleted = await TaskAssignment.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).send({ message: "Assignment not found." });
    res.send({ message: "Assignment removed." });
  } catch (err) {
    console.error("Error deleting assignment:", err);
    res.status(500).send({ message: err.message || "Error deleting assignment." });
  }
};