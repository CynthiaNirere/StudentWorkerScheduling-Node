import db from "../models/index.js";

const TimeOffRequest = db.timeOffRequest;
const Shift          = db.Shift;
const { Op }         = db.Sequelize;

// Create and Save a new Time Off Request
export const create = async (req, res) => {
  try {
    if (!req.body.startDate || !req.body.endDate) {
      return res.status(400).send({ message: "Start date and end date are required!" });
    }

    if (parseInt(req.body.endDate) < parseInt(req.body.startDate)) {
      return res.status(400).send({ message: "End date must be after start date!" });
    }

    const request = await TimeOffRequest.create({
      userId:     req.user.id,
      startDate:  req.body.startDate,
      endDate:    req.body.endDate,
      reason:     req.body.reason || null,
      status:     'pending',
      createdAt:  Date.now(),
      approvedBy: null,
      approvedAt: null
    });

    res.status(201).send(request);

  } catch (err) {
    console.error("Error creating time off request:", err.message);
    res.status(500).send({ message: err.message || "Error creating time off request." });
  }
};

// Retrieve all Time Off Requests with optional filters
export const findAll = async (req, res) => {
  try {
    const { userId, status } = req.query;

    let condition = {};
    if (userId)  condition.userId = userId;
    if (status)  condition.status = status;

    const userInclude = {
      model:      db.user,
      as:         'employee',
      attributes: ['id', 'fName', 'lName', 'work_location']
    };

    if (req.workLocation && req.userRole !== 'admin') {
      userInclude.where    = { work_location: req.workLocation };
      userInclude.required = true;
    }

    const requests = await TimeOffRequest.findAll({
      where:   condition,
      include: [userInclude]
    });

    const result = requests.map(r => {
      const plain = r.get({ plain: true });
      const emp   = plain.employee;
      return {
        ...plain,
        employeeName: emp ? `${emp.fName} ${emp.lName}` : 'Unknown',
      };
    });

    res.send(result);
  } catch (err) {
    console.error("Error retrieving time off requests:", err);
    res.status(500).send({ message: "Error retrieving time off requests." });
  }
};

// Find one Time Off Request by ID
export const findOne = async (req, res) => {
  try {
    const request = await TimeOffRequest.findByPk(req.params.id);
    if (!request) return res.status(404).send({ message: `Time off request not found.` });
    res.send(request);
  } catch (err) {
    console.error("Error retrieving time off request:", err);
    res.status(500).send({ message: "Error retrieving time off request." });
  }
};

// Update a Time Off Request
export const update = async (req, res) => {
  try {
    const [updated] = await TimeOffRequest.update(req.body, { where: { id: req.params.id } });
    if (updated === 1)
      res.send({ message: "Time off request updated successfully." });
    else
      res.status(404).send({ message: "Time off request not found or no data changed." });
  } catch (err) {
    console.error("Error updating time off request:", err);
    res.status(500).send({ message: "Error updating time off request." });
  }
};

// Delete a Time Off Request
export const remove = async (req, res) => {
  try {
    const request = await TimeOffRequest.findByPk(req.params.id);
    if (!request) return res.status(404).send({ message: "Time off request not found." });

    await TimeOffRequest.destroy({ where: { id: req.params.id } });
    res.send({ message: "Time off request deleted successfully." });

  } catch (err) {
    console.error("Error deleting time off request:", err);
    res.status(500).send({ message: err.message || "Error deleting time off request." });
  }
};

// ── APPROVE ───────────────────────────────────────────────────────────────
// When approved:
// 1. Mark the time-off request as approved
// 2. Find all shifts assigned to this employee in the approved date range
// 3. Set those shifts to status='open' and clear the userId
//    so they appear as claimable on the schedule
export const approve = async (req, res) => {
  try {
    const request = await TimeOffRequest.findByPk(req.params.id);
    if (!request) return res.status(404).send({ message: "Time off request not found." });
    if (request.status !== 'pending') {
      return res.status(400).send({ message: "Request has already been processed." });
    }

    // Step 1: approve the request
    await request.update({
      status:     'approved',
      approvedBy: req.user.id,
      approvedAt: Date.now()
    });

    // Step 2: find and open affected shifts
    // The date range is stored as timestamps; we find shifts whose shiftTime
    // falls within [startDate, endDate] and are assigned to this employee
    const startMs = Number(request.startDate);
    const endMs   = Number(request.endDate);
    const userId  = request.userId;

    let openedShifts = 0;
    try {
      const affectedShifts = await Shift.findAll({
        where: {
          userId:    userId,
          shiftTime: { [Op.between]: [startMs, endMs] },
          status:    { [Op.in]: ['published', 'draft'] }, // only affect active shifts
        }
      });

      for (const shift of affectedShifts) {
        await shift.update({
          status:    'open',      // employees will see this as claimable
          userId:    null,        // unassign from the employee
          updatedAt: Date.now(),
        });
      }
      openedShifts = affectedShifts.length;
      console.log(`✅ Time-off approved: ${openedShifts} shift(s) set to open for user ${userId}`);
    } catch (shiftErr) {
      // Don't fail the whole approval if shift update has an issue — log and continue
      console.error("Warning: could not open affected shifts:", shiftErr.message);
    }

    res.send({
      message:      "Time off request approved successfully.",
      request,
      openedShifts, // tell the frontend how many shifts were opened
    });

  } catch (err) {
    console.error("Error approving time off request:", err);
    res.status(500).send({ message: err.message || "Error approving time off request." });
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

    await request.update({
      status:     'denied',
      approvedBy: req.user.id,
      approvedAt: Date.now()
    });

    res.send({ message: "Time off request denied.", request });

  } catch (err) {
    console.error("Error denying time off request:", err);
    res.status(500).send({ message: err.message || "Error denying time off request." });
  }
};

// Get all pending time off requests (scoped by employer's work_location)
export const findPending = async (req, res) => {
  try {
    const userInclude = {
      model:      db.user,
      as:         'employee',
      attributes: ['id', 'fName', 'lName', 'work_location']
    };

    if (req.workLocation && req.userRole !== 'admin') {
      userInclude.where    = { work_location: req.workLocation };
      userInclude.required = true;
    }

    const requests = await TimeOffRequest.findAll({
      where:   { status: 'pending' },
      include: [userInclude]
    });
    res.send(requests);
  } catch (err) {
    console.error("Error retrieving pending time off requests:", err);
    res.status(500).send({ message: "Error retrieving pending time off requests." });
  }
};