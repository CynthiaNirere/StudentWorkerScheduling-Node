import db from "../models/index.js";

const Schedule = db.schedule;

export const create = async (req, res) => {
  try {
    if (!req.body.locationId || !req.body.weekStartDate || !req.body.status) {
      return res.status(400).send({ message: "Required fields missing!" });
    }

    const now = Date.now();

    const schedule = await Schedule.create({
      locationId: req.body.locationId,
      weekStartDate: req.body.weekStartDate,
      status: req.body.status,
      createdBy: req.user.userId,
      publishedAt: req.body.publishedAt ?? null,
      createdAt: now,
      updatedAt: now,
    });

    return res.status(201).send(schedule);
  } catch (err) {
    return res.status(500).send({ message: err.message || "Error creating schedule." });
  }
};

export const findAll = async (req, res) => {
  try {
    const schedules = await Schedule.findAll();
    return res.send(schedules);
  } catch (err) {
    return res.status(500).send({ message: err.message || "Error retrieving schedules." });
  }
};

export const findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const schedule = await Schedule.findByPk(id);

    if (!schedule) {
      return res.status(404).send({ message: `Schedule not found with id=${id}` });
    }

    return res.send(schedule);
  } catch (err) {
    return res.status(500).send({ message: err.message || "Error retrieving schedule." });
  }
};

export const update = async (req, res) => {
  try {
    const id = req.params.id;

    const [updated] = await Schedule.update(
      { ...req.body, updatedAt: Date.now() },
      { where: { id } }
    );

    if (updated === 1) return res.send({ message: "Schedule updated successfully." });
    return res.status(404).send({ message: "Schedule not found or no data changed." });
  } catch (err) {
    return res.status(500).send({ message: err.message || "Error updating schedule." });
  }
};

export const remove = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await Schedule.destroy({ where: { id } });

    if (deleted) return res.send({ message: "Schedule deleted successfully." });
    return res.status(404).send({ message: "Schedule not found." });
  } catch (err) {
    return res.status(500).send({ message: err.message || "Error deleting schedule." });
  }
};