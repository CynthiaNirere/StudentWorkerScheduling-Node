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
      status: "clocked_in",
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
      {
        clockOutTime: now,
        totalHoursWorked: hoursWorked,
        status: "clocked_out",
      },
      { where: { id } }
    );

    if (updated === 1) {
      return res.send({
        message: "Clocked out successfully.",
        totalHoursWorked: parseFloat(hoursWorked),
      });
    }
    return res.status(500).send({ message: "Error clocking out." });
  } catch (err) {
    return res.status(500).send({ message: err.message || "Error clocking out." });
  }
};

export const findAll = async (req, res) => {
  try {
    const records = await Clock.findAll();
    return res.send(records);
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
    const records = await Clock.findAll({ where: { userId } });
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