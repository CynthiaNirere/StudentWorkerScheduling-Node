import db from "../models/index.js";
const Clock = db.clock;

export const clockIn = async (req, res) => {
  try {
    if (!req.body.shiftId) {
      return res.status(400).send({ message: "shiftId is required!" });
    }
    const now = Date.now();
    const clock = await Clock.create({
      shiftId: req.body.shiftId,
      userId: req.user.userId,
      clockInTime: now,
      status: "pending",   // ✅ employees submit as pending for employer review
      notes: req.body.notes ?? null,
      createdAt: now,
    });
    return res.status(201).send(clock);
  } catch (err) {
    return res.status(500).send({ message: err.message || "Error clocking in." });
  }
};

export const clockOut = async (req, res) => {
  try {
    const id = req.params.id;
    const clock = await Clock.findByPk(id);
    if (!clock) {
      return res.status(404).send({ message: `Clock record not found with id=${id}` });
    }
    if (clock.clockOutTime) {
      return res.status(400).send({ message: "Already clocked out." });
    }
    const now = Date.now();
    const hoursWorked = ((now - clock.clockInTime) / (1000 * 60 * 60)).toFixed(2);
    const [updated] = await Clock.update(
      { clockOutTime: now, totalHoursWorked: hoursWorked, status: "pending" },
      { where: { id } }
    );
    if (updated === 1) {
      return res.send({ message: "Clocked out successfully.", totalHoursWorked: parseFloat(hoursWorked) });
    }
    return res.status(500).send({ message: "Error clocking out." });
  } catch (err) {
    return res.status(500).send({ message: err.message || "Error clocking out." });
  }
};

export const findAll = async (req, res) => {
  try {
    // ✅ Include user info so employer sees employee names
    const User = db.user;
    const records = await Clock.findAll({
      include: [
        {
          model: User,
          // ✅ No 'as' alias — matches the association in models/index.js which has none
          attributes: ['id', 'fName', 'lName', 'email'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const formatted = records.map(r => {
      const plain = r.get({ plain: true });
      // Sequelize uses the model name as key when no alias: plain.User
      const u = plain.User || plain.user;
      return {
        ...plain,
        clock_in: plain.clockInTime,
        clockIn: plain.clockInTime,
        clock_out: plain.clockOutTime,
        clockOut: plain.clockOutTime,
        employee_name: u ? `${u.fName} ${u.lName}` : 'Unknown',
        employeeName: u ? `${u.fName} ${u.lName}` : 'Unknown',
      };
    });

    return res.send(formatted);
  } catch (err) {
    return res.status(500).send({ message: err.message || "Error retrieving clock records." });
  }
};

export const findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const clock = await Clock.findByPk(id);
    if (!clock) {
      return res.status(404).send({ message: `Clock record not found with id=${id}` });
    }
    return res.send(clock);
  } catch (err) {
    return res.status(500).send({ message: err.message || "Error retrieving clock record." });
  }
};

export const findByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const records = await Clock.findAll({ where: { userId }, order: [['createdAt', 'DESC']] });
    return res.send(records);
  } catch (err) {
    return res.status(500).send({ message: err.message || "Error retrieving user clock records." });
  }
};

export const update = async (req, res) => {
  try {
    const id = req.params.id;
    const { notes, status, approvedBy, approvedAt } = req.body;
    const [updated] = await Clock.update({ notes, status, approvedBy, approvedAt }, { where: { id } });
    if (updated === 1) return res.send({ message: "Clock record updated successfully." });
    return res.status(404).send({ message: "Clock record not found or no data changed." });
  } catch (err) {
    return res.status(500).send({ message: err.message || "Error updating clock record." });
  }
};

export const remove = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await Clock.destroy({ where: { id } });
    if (deleted) return res.send({ message: "Clock record deleted successfully." });
    return res.status(404).send({ message: "Clock record not found." });
  } catch (err) {
    return res.status(500).send({ message: err.message || "Error deleting clock record." });
  }
};

// ✅ NEW: Employer approves a submitted time card
export const approve = async (req, res) => {
  try {
    const id = req.params.id;
    const clock = await Clock.findByPk(id);
    if (!clock) {
      return res.status(404).send({ message: "Clock record not found." });
    }
    if (clock.status === 'approved') {
      return res.status(400).send({ message: "Time card already approved." });
    }
    await Clock.update(
      {
        status: 'approved',
        approvedBy: req.user?.userId || req.user?.id || null,
        approvedAt: Date.now(),
      },
      { where: { id } }
    );
    return res.send({ message: "Time card approved successfully." });
  } catch (err) {
    return res.status(500).send({ message: err.message || "Error approving time card." });
  }
};

// ✅ NEW: Employer rejects a submitted time card
export const reject = async (req, res) => {
  try {
    const id = req.params.id;
    const clock = await Clock.findByPk(id);
    if (!clock) {
      return res.status(404).send({ message: "Clock record not found." });
    }
    await Clock.update(
      {
        status: 'rejected',
        approvedBy: req.user?.userId || req.user?.id || null,
        approvedAt: Date.now(),
        notes: req.body.reason
          ? `REJECTED: ${req.body.reason}`
          : (clock.notes ? `REJECTED. ${clock.notes}` : 'REJECTED by employer'),
      },
      { where: { id } }
    );
    return res.send({ message: "Time card rejected." });
  } catch (err) {
    return res.status(500).send({ message: err.message || "Error rejecting time card." });
  }
};

// ✅ NEW: Employer modifies clock in/out times and auto-approves
export const modify = async (req, res) => {
  try {
    const id = req.params.id;
    const clock = await Clock.findByPk(id);
    if (!clock) {
      return res.status(404).send({ message: "Clock record not found." });
    }

    const { clockInTime, clockOutTime, notes } = req.body;

    if (!clockInTime) {
      return res.status(400).send({ message: "clockInTime is required." });
    }

    const inTime = Number(clockInTime);
    const outTime = clockOutTime ? Number(clockOutTime) : null;

    let totalHoursWorked = null;
    if (outTime) {
      totalHoursWorked = ((outTime - inTime) / (1000 * 60 * 60)).toFixed(2);
    }

    await Clock.update(
      {
        clockInTime: inTime,
        clockOutTime: outTime,
        totalHoursWorked: totalHoursWorked ? parseFloat(totalHoursWorked) : null,
        status: 'approved',
        approvedBy: req.user?.userId || req.user?.id || null,
        approvedAt: Date.now(),
        notes: notes || `Modified by employer`,
      },
      { where: { id } }
    );

    return res.send({
      message: "Time card modified and approved.",
      totalHoursWorked: totalHoursWorked ? parseFloat(totalHoursWorked) : null,
    });
  } catch (err) {
    return res.status(500).send({ message: err.message || "Error modifying time card." });
  }
};