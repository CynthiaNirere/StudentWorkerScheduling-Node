import Coverage from "../models/coverage.models.js";

// Create a new Coverage template
export const create = async (req, res) => {
  try {
    if (!req.body.locationId || !req.body.jobRoleId || req.body.dayOfWeek === undefined || !req.body.startTime === undefined || !req.body.endTime === undefined || !req.body.numberOfWorkersNeeded) {
      return res.status(400).send({ message: "Required fields missing!" });
    }

    const coverage = await Coverage.create({
      locationId: req.body.locationId,
      jobRoleId: req.body.jobRoleId,
      dayOfWeek: req.body.dayOfWeek,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      numberOfWorkersNeeded: req.body.numberOfWorkersNeeded,
      isActive: req.body.isActive ?? 1,
    });

    res.status(201).send(coverage);
  } catch (err) {
    console.error("Error creating coverage:", err.message);
    res.status(500).send({ message: err.message || "Error creating coverage." });
  }
};

// Retrieve all Coverage templates
export const findAll = async (req, res) => {
  try {
    const coverages = await Coverage.findAll();
    res.send(coverages);
  } catch (err) {
    console.error("Error retrieving coverages:", err);
    res.status(500).send({ message: "Error retrieving coverages." });
  }
};

// Find one Coverage by ID
export const findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const coverage = await Coverage.findByPk(id);
    if (!coverage)
      return res.status(404).send({ message: `Coverage not found with id=${id}` });
    res.send(coverage);
  } catch (err) {
    console.error("Error retrieving coverage:", err);
    res.status(500).send({ message: "Error retrieving coverage." });
  }
};

// Find by Location
export const findByLocation = async (req, res) => {
  try {
    const locationId = req.params.locationId;
    const coverages = await Coverage.findAll({ where: { locationId } });
    res.send(coverages);
  } catch (err) {
    console.error("Error retrieving coverage by location:", err);
    res.status(500).send({ message: "Error retrieving coverage by location." });
  }
};

// Find by Job Role
export const findByJobRole = async (req, res) => {
  try {
    const jobRoleId = req.params.jobRoleId;
    const coverages = await Coverage.findAll({ where: { jobRoleId } });
    res.send(coverages);
  } catch (err) {
    console.error("Error retrieving coverage by job role:", err);
    res.status(500).send({ message: "Error retrieving coverage by job role." });
  }
};

// Find by Location and Day
export const findByLocationAndDay = async (req, res) => {
  try {
    const { locationId, dayOfWeek } = req.params;
    const coverages = await Coverage.findAll({
      where: { locationId, dayOfWeek },
    });
    res.send(coverages);
  } catch (err) {
    console.error("Error retrieving coverage by location and day:", err);
    res.status(500).send({ message: "Error retrieving coverage by location and day." });
  }
};

// Update a Coverage template
export const update = async (req, res) => {
  try {
    const id = req.params.id;
    const [updated] = await Coverage.update(req.body, { where: { id } });
    if (updated === 1)
      res.send({ message: "Coverage updated successfully." });
    else
      res.status(404).send({ message: "Coverage not found or no data changed." });
  } catch (err) {
    console.error("Error updating coverage:", err);
    res.status(500).send({ message: "Error updating coverage." });
  }
};

// Delete a Coverage template
export const remove = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await Coverage.destroy({ where: { id } });
    if (deleted)
      res.send({ message: "Coverage deleted successfully." });
    else
      res.status(404).send({ message: "Coverage not found." });
  } catch (err) {
    console.error("Error deleting coverage:", err);
    res.status(500).send({ message: err.message || "Error deleting coverage." });
  }
};