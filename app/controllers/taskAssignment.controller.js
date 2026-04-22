import db from "../models/index.js";
const TaskAssignment = db.taskAssignment;
const TaskList = db.taskList;

export const getMyAssignedTaskLists = async (req, res) => {
  try {
    const employeeId = req.user?.userId || req.user?.user_id || req.user?.id;

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