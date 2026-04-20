import db from "../models/index.js";

const Clock = db.clock;
const { Op } = db.Sequelize;

const getClockId = (req) => req.params.id || req.params.clockId;
const getUserId  = (req) => req.user?.userId || req.user?.user_id || req.user?.id;

// ── GET ALL ───────────────────────────────────────────────────────────────
// Employers see all records at their work_location.
// Employees see only their own records.
// Supports ?userId= query param for employee self-lookup.
export const findAll = async (req, res) => {
  try {
    const requestingRole   = req.user?.role;
    const requestingUserId = getUserId(req);
    const workLocation     = req.user?.work_location;

    // If a userId query param is provided by an employee, scope to that user
    // (employees can only fetch their own records this way)
    const queryUserId = req.query.userId || req.query.user_id;
    if (queryUserId && requestingRole === 'employee') {
      // Security: employees can only query their own records
      if (String(queryUserId) !== String(requestingUserId)) {
        return res.status(403).send({ message: "Access denied." });
      }
    }

    // Determine the effective userId filter
    const filterUserId = (requestingRole === 'employee')
      ? requestingUserId
      : (queryUserId || null); // employers can optionally filter by userId

    let records;

    if (requestingRole === 'employer' || requestingRole === 'admin') {

      if (filterUserId) {
        // Employer querying a specific employee's records
        records = await db.sequelize.query(`
          SELECT
            c.clock_id,
            c.clock_id   AS id,
            c.shift_id,
            c.user_id,
            c.clock_in_time   AS clockInTime,
            c.clock_out_time  AS clockOutTime,
            c.total_hours_worked AS totalHoursWorked,
            c.status,
            c.notes,
            CASE WHEN c.status = 'rejected' THEN c.notes ELSE NULL END AS rejection_reason,
            c.approved_by  AS approvedBy,
            c.approved_at  AS approvedAt,
            c.created_at   AS createdAt,
            CONCAT(u.first_name, ' ', u.last_name) AS employee_name,
            u.email AS employee_email,
            u.work_location
          FROM Clock_IN_Clock_OUT c
          LEFT JOIN User u ON c.user_id = u.user_id
          WHERE c.user_id = :userId
          ORDER BY c.clock_in_time DESC
        `, {
          replacements: { userId: filterUserId },
          type: db.Sequelize.QueryTypes.SELECT,
        });

      } else if (workLocation) {
        // Scoped: only records for employees at this location
        records = await db.sequelize.query(`
          SELECT
            c.clock_id,
            c.clock_id   AS id,
            c.shift_id,
            c.user_id,
            c.clock_in_time   AS clockInTime,
            c.clock_out_time  AS clockOutTime,
            c.total_hours_worked AS totalHoursWorked,
            c.status,
            c.notes,
            CASE WHEN c.status = 'rejected' THEN c.notes ELSE NULL END AS rejection_reason,
            c.approved_by  AS approvedBy,
            c.approved_at  AS approvedAt,
            c.created_at   AS createdAt,
            CONCAT(u.first_name, ' ', u.last_name) AS employee_name,
            u.email AS employee_email,
            u.work_location
          FROM Clock_IN_Clock_OUT c
          LEFT JOIN User u ON c.user_id = u.user_id
          WHERE u.work_location = :locationId
             OR EXISTS (
               SELECT 1 FROM Shift s
               WHERE s.shift_id = c.shift_id
                 AND s.location_id = :locationId
             )
          ORDER BY c.clock_in_time DESC
        `, {
          replacements: { locationId: workLocation },
          type: db.Sequelize.QueryTypes.SELECT,
        });

      } else {
        // No work_location set — return all records (admin fallback)
        records = await db.sequelize.query(`
          SELECT
            c.clock_id,
            c.clock_id   AS id,
            c.shift_id,
            c.user_id,
            c.clock_in_time   AS clockInTime,
            c.clock_out_time  AS clockOutTime,
            c.total_hours_worked AS totalHoursWorked,
            c.status,
            c.notes,
            CASE WHEN c.status = 'rejected' THEN c.notes ELSE NULL END AS rejection_reason,
            c.approved_by  AS approvedBy,
            c.approved_at  AS approvedAt,
            c.created_at   AS createdAt,
            CONCAT(u.first_name, ' ', u.last_name) AS employee_name,
            u.email AS employee_email,
            u.work_location
          FROM Clock_IN_Clock_OUT c
          LEFT JOIN User u ON c.user_id = u.user_id
          ORDER BY c.clock_in_time DESC
        `, { type: db.Sequelize.QueryTypes.SELECT });
      }

    } else {
      // Employee: only their own records
      records = await db.sequelize.query(`
        SELECT
          c.clock_id,
          c.clock_id   AS id,
          c.shift_id,
          c.user_id,
          c.clock_in_time   AS clockInTime,
          c.clock_out_time  AS clockOutTime,
          c.total_hours_worked AS totalHoursWorked,
          c.status,
          c.notes,
          CASE WHEN c.status = 'rejected' THEN c.notes ELSE NULL END AS rejection_reason,
          c.approved_by  AS approvedBy,
          c.approved_at  AS approvedAt,
          c.created_at   AS createdAt,
          CONCAT(u.first_name, ' ', u.last_name) AS employee_name,
          u.email AS employee_email
        FROM Clock_IN_Clock_OUT c
        LEFT JOIN User u ON c.user_id = u.user_id
        WHERE c.user_id = :userId
        ORDER BY c.clock_in_time DESC
      `, {
        replacements: { userId: requestingUserId },
        type: db.Sequelize.QueryTypes.SELECT,
      });
    }

    console.log(`✅ Clock records returned: ${records.length}`);
    res.send(records);

  } catch (err) {
    console.error("Error retrieving clock records:", err);
    res.status(500).send({ message: "Error retrieving clock records.", error: err.message });
  }
};

// ── GET ONE ───────────────────────────────────────────────────────────────
export const findOne = async (req, res) => {
  try {
    const record = await Clock.findByPk(getClockId(req));
    if (!record) return res.status(404).send({ message: "Clock record not found." });
    res.send(record);
  } catch (err) {
    console.error("Error retrieving clock record:", err);
    res.status(500).send({ message: "Error retrieving clock record." });
  }
};

// ── CLOCK IN ──────────────────────────────────────────────────────────────
export const clockIn = async (req, res) => {
  try {
    const requestingRole = req.user?.role;
    const userId = (requestingRole === 'employer' && req.body.userId)
      ? req.body.userId
      : getUserId(req);
    const shiftId = req.body.shiftId || req.body.shift_id || null;

    // Manual entry: clockInTime provided in body (no active shift)
    if (!shiftId) {
      const { clockInTime, clockOutTime, notes } = req.body;
      if (!clockInTime) return res.status(400).send({ message: "clockInTime is required for manual entries." });

      const inMs       = Number(clockInTime);
      const outMs      = clockOutTime ? Number(clockOutTime) : null;
      const totalHours = outMs ? parseFloat(((outMs - inMs) / (1000 * 60 * 60)).toFixed(2)) : null;

      const record = await Clock.create({
        userId,
        shiftId:          null,
        clockInTime:      inMs,
        clockOutTime:     outMs,
        totalHoursWorked: totalHours,
        notes:            notes || null,
        status:           'pending',
        createdAt:        Date.now(),
      });

      return res.status(201).send(record);
    }

    // Normal clock-in with a shift
    const existing = await Clock.findOne({ where: { userId, status: 'clocked_in' } });
    if (existing) return res.status(400).send({ message: "Already clocked in." });

    const record = await Clock.create({
      shiftId,
      userId,
      clockInTime: Date.now(),
      status:      'clocked_in',
      createdAt:   Date.now(),
    });

    res.status(201).send(record);
  } catch (err) {
    console.error("Error clocking in:", err);
    res.status(500).send({ message: "Error clocking in." });
  }
};

// ── MANUAL ENTRY ─────────────────────────────────────────────────────────
// Creates a complete time record without a shift (manual/historical entries).
export const createManual = async (req, res) => {
  try {
    const requestingRole = req.user?.role;
    const userId = (requestingRole === 'employer' && req.body.userId)
      ? req.body.userId
      : getUserId(req);

    const { clockInTime, clockOutTime, notes } = req.body;

    if (!clockInTime) return res.status(400).send({ message: "clockInTime is required." });

    const inMs       = Number(clockInTime);
    const outMs      = clockOutTime ? Number(clockOutTime) : null;
    const totalHours = outMs ? parseFloat(((outMs - inMs) / (1000 * 60 * 60)).toFixed(2)) : null;

    const record = await Clock.create({
      userId,
      shiftId:          null,
      clockInTime:      inMs,
      clockOutTime:     outMs,
      totalHoursWorked: totalHours,
      notes:            notes || null,
      status:           'pending',
      createdAt:        Date.now(),
    });

    res.status(201).send(record);
  } catch (err) {
    console.error("Error creating manual entry:", err);
    res.status(500).send({ message: "Error creating manual entry." });
  }
};

// ── CLOCK OUT ─────────────────────────────────────────────────────────────
export const clockOut = async (req, res) => {
  try {
    const requestingRole = req.user?.role;
    const userId = (requestingRole === 'employer' && req.body.userId)
      ? req.body.userId
      : getUserId(req);

    const record = await Clock.findOne({ where: { userId, status: 'clocked_in' } });
    if (!record) return res.status(404).send({ message: "No active clock-in found." });

    const clockOutTime = Date.now();
    const totalHours   = parseFloat(((clockOutTime - Number(record.clockInTime)) / (1000 * 60 * 60)).toFixed(2));

    await Clock.update(
      { clockOutTime, totalHoursWorked: totalHours, status: 'pending' },
      { where: { id: record.id } }
    );

    const updated = await Clock.findByPk(record.id);
    res.send(updated);
  } catch (err) {
    console.error("Error clocking out:", err);
    res.status(500).send({ message: "Error clocking out." });
  }
};

// ── SUBMIT TIMECARD ───────────────────────────────────────────────────────
// Called by employee at end of week to submit their pay period for review.
// Marks all 'pending' and 'clocked_out' records in the period as 'submitted'.
export const submitTimecard = async (req, res) => {
  try {
    const requestingUserId = getUserId(req);
    const { userId, periodStart, periodEnd } = req.body;

    // Employees can only submit their own timecard
    const targetUserId = (req.user?.role === 'employer') ? userId : requestingUserId;

    if (!targetUserId) {
      return res.status(400).send({ message: "userId is required." });
    }
    if (!periodStart || !periodEnd) {
      return res.status(400).send({ message: "periodStart and periodEnd are required." });
    }

    const periodStartMs = Number(periodStart);
    const periodEndMs   = Number(periodEnd);

    // Find all pending/clocked_out records for this user in the period
    const records = await db.sequelize.query(`
      SELECT c.clock_id AS id
      FROM Clock_IN_Clock_OUT c
      WHERE c.user_id = :userId
        AND c.status IN ('pending', 'clocked_out')
        AND c.clock_in_time >= :periodStart
        AND c.clock_in_time <= :periodEnd
    `, {
      replacements: { userId: targetUserId, periodStart: periodStartMs, periodEnd: periodEndMs },
      type: db.Sequelize.QueryTypes.SELECT,
    });

    if (records.length === 0) {
      return res.status(200).send({ message: "No pending records found for this period.", count: 0 });
    }

    const ids = records.map(r => r.id);

    // Mark all as 'submitted' — employer can then approve or reject
    await Clock.update(
      { status: 'pending', updatedAt: Date.now() },
      { where: { id: { [Op.in]: ids } } }
    );

    console.log(`✅ Timecard submitted: ${ids.length} records for user ${targetUserId}`);
    res.send({
      message: `Timecard submitted successfully. ${ids.length} entr${ids.length === 1 ? 'y' : 'ies'} sent for manager review.`,
      count:   ids.length,
      recordIds: ids,
    });

  } catch (err) {
    console.error("Error submitting timecard:", err);
    res.status(500).send({ message: "Error submitting timecard.", error: err.message });
  }
};

// ── APPROVE ───────────────────────────────────────────────────────────────
export const approve = async (req, res) => {
  try {
    const approverId = getUserId(req);
    const [updated]  = await Clock.update(
      { status: 'approved', approvedBy: approverId, approvedAt: Date.now() },
      { where: { id: getClockId(req) } }
    );
    if (updated === 0) return res.status(404).send({ message: "Clock record not found." });
    res.send({ message: "Time card approved." });
  } catch (err) {
    console.error("Error approving clock record:", err);
    res.status(500).send({ message: "Error approving time card." });
  }
};

// ── REJECT ────────────────────────────────────────────────────────────────
export const reject = async (req, res) => {
  try {
    const reason    = req.body.reason || '';
    const [updated] = await Clock.update(
      { status: 'rejected', notes: reason },
      { where: { id: getClockId(req) } }
    );
    if (updated === 0) return res.status(404).send({ message: "Clock record not found." });
    res.send({ message: "Time card rejected." });
  } catch (err) {
    console.error("Error rejecting clock record:", err);
    res.status(500).send({ message: "Error rejecting time card." });
  }
};

// ── MODIFY (employer edits and auto-approves) ─────────────────────────────
export const modify = async (req, res) => {
  try {
    const approverId = getUserId(req);
    const { clockInTime, clockOutTime, notes } = req.body;

    if (!clockInTime) return res.status(400).send({ message: "clockInTime is required." });

    const inMs       = Number(clockInTime);
    const outMs      = clockOutTime ? Number(clockOutTime) : null;
    const totalHours = outMs ? parseFloat(((outMs - inMs) / (1000 * 60 * 60)).toFixed(2)) : null;

    const [updated] = await Clock.update(
      {
        clockInTime:      inMs,
        clockOutTime:     outMs,
        totalHoursWorked: totalHours,
        notes:            notes || 'Modified by employer',
        status:           'approved',
        approvedBy:       approverId,
        approvedAt:       Date.now(),
      },
      { where: { id: getClockId(req) } }
    );

    if (updated === 0) return res.status(404).send({ message: "Clock record not found." });

    const record = await Clock.findByPk(getClockId(req));
    res.send(record);
  } catch (err) {
    console.error("Error modifying clock record:", err);
    res.status(500).send({ message: "Error modifying time card." });
  }
};

// ── DELETE ────────────────────────────────────────────────────────────────
export const remove = async (req, res) => {
  try {
    const deleted = await Clock.destroy({ where: { id: getClockId(req) } });
    if (!deleted) return res.status(404).send({ message: "Clock record not found." });
    res.send({ message: "Clock record deleted." });
  } catch (err) {
    console.error("Error deleting clock record:", err);
    res.status(500).send({ message: "Error deleting clock record." });
  }
};