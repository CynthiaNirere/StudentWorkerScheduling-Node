import db from "../models/index.js";

const Availability  = db.availability;
const UserWorkplace = db.userWorkplace;
const { Op }        = db.Sequelize;

// ── HELPER: get the caller's effective location ───────────────────────────
// Works for normal employers, impersonating admins, and employees.
const getCallerLocation = (req) =>
  req.user?.impersonatedLocation ||
  req.user?.work_location        ||
  req.workLocation               ||
  null;

// ── CREATE ────────────────────────────────────────────────────────────────
export const create = async (req, res) => {
  try {
    if (req.body.dayOfWeek === undefined || !req.body.startTime || !req.body.endTime) {
      return res.status(400).send({ message: "Required fields missing!" });
    }

    const locationId = req.body.locationId ?? req.body.location_id ?? getCallerLocation(req);

    const now = Date.now();
    const availability = await Availability.create({
      userId:        req.body.userId || req.user?.userId || req.user?.id,
      dayOfWeek:     req.body.dayOfWeek,
      startTime:     req.body.startTime,
      endTime:       req.body.endTime,
      locationId:    locationId ?? null,   // ✅ scoped to workplace
      effectiveDate: req.body.effectiveDate ?? null,
      isActive:      req.body.isActive ?? 1,
      createdAt:     now,
      updatedAt:     now,
    });

    return res.status(201).send(availability);
  } catch (err) {
    return res.status(500).send({ message: err.message || "Error creating availability." });
  }
};

// ── FIND ALL (employer view — scoped to their location) ───────────────────
// The employer calls this to see their employees' availability.
// It ONLY returns rows where location_id matches the employer's workplace,
// so Brew employers never see Gym availability rows, even for shared employees.
export const findAll = async (req, res) => {
  try {
    const where = {};

    // Optional: filter by location
    if (req.query.locationId || req.query.location_id) {
      where.locationId = req.query.locationId || req.query.location_id;
    }

    // Optional: filter by a specific user
    if (req.query.userId || req.query.user_id) {
      where.userId = req.query.userId || req.query.user_id;
    }

    const availabilities = await Availability.findAll({ where });
    return res.send(availabilities);
  } catch (err) {
    return res.status(500).send({ message: err.message || "Error retrieving availabilities." });
  }
};

// ── FIND ONE ──────────────────────────────────────────────────────────────
export const findOne = async (req, res) => {
  try {
    const id           = req.params.id;
    const availability = await Availability.findByPk(id);
    if (!availability) {
      return res.status(404).send({ message: `Availability not found with id=${id}` });
    }
    return res.send(availability);
  } catch (err) {
    return res.status(500).send({ message: err.message || "Error retrieving availability." });
  }
};

// ── FIND BY USER (employee fetching their own) ────────────────────────────
// When an employee loads their own availability, optionally filter by location
// so each workplace picker only loads that workplace's saved slots.
export const findByUser = async (req, res) => {
  try {
    const userId     = req.params.userId;
    const locationId = req.query.locationId || req.query.location_id || null;

    const where = { userId };
    if (locationId) where.locationId = locationId;   // ✅ per-workplace filter

    const availabilities = await Availability.findAll({ where });
    return res.send(availabilities);
  } catch (err) {
    return res.status(500).send({ message: err.message || "Error retrieving user availability." });
  }
};

// ── UPDATE ────────────────────────────────────────────────────────────────
export const update = async (req, res) => {
  try {
    const id = req.params.id;

    // Prevent accidentally overwriting location_id with null on plain edits
    const updateData = { ...req.body, updatedAt: Date.now() };
    if (!updateData.locationId && !updateData.location_id) {
      delete updateData.locationId;
      delete updateData.location_id;
    }

    const [updated] = await Availability.update(updateData, { where: { id } });
    if (updated === 1) return res.send({ message: "Availability updated successfully." });
    return res.status(404).send({ message: "Availability not found or no data changed." });
  } catch (err) {
    return res.status(500).send({ message: err.message || "Error updating availability." });
  }
};

// ── REMOVE ────────────────────────────────────────────────────────────────
export const remove = async (req, res) => {
  try {
    const id      = req.params.id;
    const deleted = await Availability.destroy({ where: { id } });
    if (deleted) return res.send({ message: "Availability deleted successfully." });
    return res.status(404).send({ message: "Availability not found." });
  } catch (err) {
    return res.status(500).send({ message: err.message || "Error deleting availability." });
  }
};