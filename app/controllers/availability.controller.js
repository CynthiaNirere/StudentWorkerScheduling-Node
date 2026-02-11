import db from "../models/index.js";

const Availability = db.availability;

export const create = async (req, res) => {
  try {
    if (req.body.dayOfWeek === undefined || !req.body.startTime || !req.body.endTime) {
      return res.status(400).send({ message: "Required fields missing!" });
    }

    const now = Date.now();

    const availability = await Availability.create({
      userId: req.user.userId,
      dayOfWeek: req.body.dayOfWeek,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      effectiveDate: req.body.effectiveDate ?? null,
      isActive: req.body.isActive ?? 1,
      createdAt: now,
      updatedAt: now,
    });

    return res.status(201).send(availability);
  } catch (err) {
    return res.status(500).send({ message: err.message || "Error creating availability." });
  }
};

export const findAll = async (req, res) => {
  try {
    const availabilities = await Availability.findAll();
    return res.send(availabilities);
  } catch (err) {
    return res.status(500).send({ message: err.message || "Error retrieving availabilities." });
  }
};

export const findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const availability = await Availability.findByPk(id);

    if (!availability) {
      return res.status(404).send({ message: `Availability not found with id=${id}` });
    }

    return res.send(availability);
  } catch (err) {
    return res.status(500).send({ message: err.message || "Error retrieving availability." });
  }
};

export const findByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const availabilities = await Availability.findAll({ where: { userId } });
    return res.send(availabilities);
  } catch (err) {
    return res.status(500).send({ message: err.message || "Error retrieving user availability." });
  }
};

export const update = async (req, res) => {
  try {
    const id = req.params.id;

    const [updated] = await Availability.update(
      { ...req.body, updatedAt: Date.now() },
      { where: { id } }
    );

    if (updated === 1) return res.send({ message: "Availability updated successfully." });
    return res.status(404).send({ message: "Availability not found or no data changed." });
  } catch (err) {
    return res.status(500).send({ message: err.message || "Error updating availability." });
  }
};

export const remove = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await Availability.destroy({ where: { id } });

    if (deleted) return res.send({ message: "Availability deleted successfully." });
    return res.status(404).send({ message: "Availability not found." });
  } catch (err) {
    return res.status(500).send({ message: err.message || "Error deleting availability." });
  }
};