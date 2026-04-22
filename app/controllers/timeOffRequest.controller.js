import db from "../models/index.js";

const TimeOffRequest = db.timeOffRequest;
const Shift          = db.Shift;
const { Op }         = db.Sequelize;

// ── GET ALL ───────────────────────────────────────────────────────────────
export const findAll = async (req, res) => {
  try {
    const requestingUserId = req.user?.userId || req.user?.id;
    const requestingUser   = await db.user.findOne({ where: { id: requestingUserId } });
    const role             = req.user?.role || requestingUser?.role;
    const workLocation     = req.user?.work_location || requestingUser?.work_location;

    let requests;

    if (role === 'employee') {
      requests = await TimeOffRequest.findAll({
        where:  { user_id: requestingUserId },
        order:  [['created_at', 'DESC']],
      });
    } else {
      const employeesAtLocation = await db.user.findAll({
        where: { work_location: workLocation, role: 'employee' },
        attributes: ['id', 'fName', 'lName', 'email'],
      });
      const employeeIds = employeesAtLocation.map(e => e.id);

      requests = await TimeOffRequest.findAll({
        where: { user_id: { [Op.in]: employeeIds } },
        order: [['created_at', 'DESC']],
      });

      const empMap = {};
      employeesAtLocation.forEach(e => {
        empMap[e.id] = `${e.fName || ''} ${e.lName || ''}`.trim() || e.email;
      });

      requests = requests.map(r => ({
        ...r.toJSON(),
        employeeName:  empMap[r.user_id] || 'Unknown',
        employee_name: empMap[r.user_id] || 'Unknown',
      }));
    }

    res.send(requests);
  } catch (err) {
    console.error("Error retrieving time off requests:", err);
    res.status(500).send({ message: "Error retrieving time off requests." });
  }
};

// ── GET PENDING (✅ ADDED — minimal, no logic interference) ────────────────
export const findPending = async (req, res) => {
  try {
    const requests = await TimeOffRequest.findAll({
      where: { status: 'pending' },
      order: [['created_at', 'DESC']],
    });

    res.send(requests);
  } catch (err) {
    console.error("Error retrieving pending time off requests:", err);
    res.status(500).send({ message: "Error retrieving pending time off requests." });
  }
};

// ── GET ONE ───────────────────────────────────────────────────────────────
export const findOne = async (req, res) => {
  try {
    const request = await TimeOffRequest.findByPk(req.params.id);
    if (!request) return res.status(404).send({ message: "Time off request not found." });
    res.send(request);
  } catch (err) {
    res.status(500).send({ message: "Error retrieving time off request." });
  }
};

// ── CREATE ────────────────────────────────────────────────────────────────
export const create = async (req, res) => {
  try {
    const userId    = req.user?.userId || req.user?.id;
    const startDate = req.body.startDate || req.body.start_date;
    const endDate   = req.body.endDate   || req.body.end_date;
    const reason    = req.body.reason    || null;

    if (!startDate || !endDate) {
      return res.status(400).send({ message: "startDate and endDate are required." });
    }

    const request = await TimeOffRequest.create({
      user_id:    userId,
      start_date: Number(startDate),
      end_date:   Number(endDate),
      reason,
      status:     'pending',
      created_at: Date.now(),
    });

    res.status(201).send(request);
  } catch (err) {
    console.error("Error creating time off request:", err);
    res.status(500).send({ message: "Error creating time off request." });
  }
};

// ── UPDATE (✅ ADDED — safe generic update) ────────────────────────────────
export const update = async (req, res) => {
  try {
    const id = req.params.id;

    const [updated] = await TimeOffRequest.update(req.body, {
      where: { id },
    });

    if (!updated) {
      return res.status(404).send({ message: "Time off request not found." });
    }

    res.send({ message: "Time off request updated successfully." });
  } catch (err) {
    console.error("Error updating time off request:", err);
    res.status(500).send({ message: "Error updating time off request." });
  }
};

// ── APPROVE ───────────────────────────────────────────────────────────────
export const approve = async (req, res) => {
  try {
    const request = await TimeOffRequest.findByPk(req.params.id);
    if (!request) return res.status(404).send({ message: "Time off request not found." });
    if (request.status !== 'pending') {
      return res.status(400).send({ message: "Request has already been processed." });
    }

    const approverId = req.user?.userId || req.user?.id;

    await request.update({
      status:      'approved',
      approved_by: approverId,
      approved_at: Date.now(),
      updated_at:  Date.now(),
    });

    let openedShifts = 0;
    try {
      const startMs = Number(request.start_date || request.startDate);
      const endMs   = Number(request.end_date   || request.endDate);
      const userId  = request.user_id;

      const endMsInclusive = endMs + 24 * 60 * 60 * 1000 - 1;

      const affectedShifts = await Shift.findAll({
        where: {
          userId:    userId,
          shiftTime: { [Op.between]: [startMs, endMsInclusive] },
          status:    { [Op.in]: ['published', 'draft', 'open'] },
        },
      });

      for (const shift of affectedShifts) {
        await shift.update({
          userId:    null,
          status:    'open',
          updatedAt: Date.now(),
        });
      }

      openedShifts = affectedShifts.length;
      console.log(`✅ Time-off approved: ${openedShifts} shift(s) opened for user ${userId}`);
    } catch (shiftErr) {
      console.error("Warning: could not open affected shifts:", shiftErr.message);
    }

    res.send({
      message: "Time off request approved.",
      request,
      openedShifts,
    });
  } catch (err) {
    console.error("Error approving time off request:", err);
    res.status(500).send({ message: "Error approving time off request." });
  }
};

// ── DENY ──────────────────────────────────────────────────────────────────
export const deny = async (req, res) => {
  try {
    const request = await TimeOffRequest.findByPk(req.params.id);
    if (!request) return res.status(404).send({ message: "Time off request not found." });
    if (request.status !== 'pending') {
      return res.status(400).send({ message: "Request has already been processed." });
    }

    const approverId = req.user?.userId || req.user?.id;
    await request.update({
      status:      'denied',
      approved_by: approverId,
      approved_at: Date.now(),
      updated_at:  Date.now(),
    });

    res.send({ message: "Time off request denied.", request });
  } catch (err) {
    console.error("Error denying time off request:", err);
    res.status(500).send({ message: "Error denying time off request." });
  }
};

// ── DELETE ────────────────────────────────────────────────────────────────
export const remove = async (req, res) => {
  try {
    const deleted = await TimeOffRequest.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).send({ message: "Time off request not found." });
    res.send({ message: "Time off request deleted." });
  } catch (err) {
    res.status(500).send({ message: "Error deleting time off request." });
  }
};