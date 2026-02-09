import db from "../models/index.js";

const Shift = db.shift;
const { Op } = db.Sequelize;

// Create and Save a new Shift
export const create = async (req, res) => {
  try {
    console.log("Creating shift with data:", req.body);
    
    if (!req.body.shiftTime || !req.body.startTime || !req.body.endTime || !req.body.locationId || !req.body.jobRoleId) {
      return res.status(400).send({ message: "Required fields missing!" });
    }
    
    // Create shift
    const shift = await Shift.create({
      shiftTime: req.body.shiftTime,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      createdBy: req.user.id, // From authentication middleware
      notes: req.body.notes || null,
      userId: req.body.userId || null,
      dayOfWeek: req.body.dayOfWeek || null,
      minimumWorkers: req.body.minimumWorkers || 1,
      maximumWorkers: req.body.maximumWorkers || 1,
      locationId: req.body.locationId,
      jobRoleId: req.body.jobRoleId,
      status: req.body.status || 'draft',
      createdAt: Date.now(),
      updatedAt: null
    });
    
    console.log("Shift created with ID:", shift.id);
    res.status(201).send(shift);
    
  } catch (err) {
    console.error("Error creating shift:", err.message);
    res.status(500).send({
      message: err.message || "Error creating shift.",
      error: err.message
    });
  }
};

// Retrieve all Shifts with optional filters
export const findAll = async (req, res) => {
  try {
    const { locationId, userId, status, startDate, endDate } = req.query;
    
    let condition = {};
    
    if (locationId) {
      condition.locationId = locationId;
    }
    
    if (userId) {
      condition.userId = userId;
    }
    
    if (status) {
      condition.status = status;
    }
    
    if (startDate && endDate) {
      condition.shiftTime = {
        [Op.between]: [parseInt(startDate), parseInt(endDate)]
      };
    }
    
    const shifts = await Shift.findAll({ where: condition });
    res.send(shifts);
  } catch (err) {
    console.error("Error retrieving shifts:", err);
    res.status(500).send({ message: "Error retrieving shifts." });
  }
};

// Find one Shift by ID
export const findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const shift = await Shift.findByPk(id);
    if (!shift)
      return res.status(404).send({ message: `Shift not found with id=${id}` });
    res.send(shift);
  } catch (err) {
    console.error("Error retrieving shift:", err);
    res.status(500).send({ message: "Error retrieving shift." });
  }
};

// Update a Shift
export const update = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Add updated timestamp
    req.body.updatedAt = Date.now();
    
    const [updated] = await Shift.update(req.body, { where: { id: id } });
    if (updated === 1)
      res.send({ message: "Shift updated successfully." });
    else
      res.status(404).send({ message: `Shift not found or no data changed.` });
  } catch (err) {
    console.error("Error updating shift:", err);
    res.status(500).send({ message: "Error updating shift." });
  }
};

// Delete a Shift
export const remove = async (req, res) => {
  try {
    const id = req.params.id;
    
    console.log(`Deleting shift ${id}...`);
    
    const shift = await Shift.findByPk(id);
    if (!shift) {
      return res.status(404).send({ message: `Shift not found.` });
    }
    
    const deleted = await Shift.destroy({ where: { id: id } });
    
    if (deleted) {
      console.log('Shift deleted successfully');
      return res.send({ message: "Shift deleted successfully." });
    }
    
    return res.status(404).send({ message: `Shift not found.` });
    
  } catch (err) {
    console.error('Error deleting shift:', err);
    res.status(500).send({ 
      message: err.message || "Error deleting shift." 
    });
  }
};

// Assign user to shift
export const assignUser = async (req, res) => {
  try {
    const id = req.params.id;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).send({ message: "User ID is required!" });
    }
    
    const shift = await Shift.findByPk(id);
    if (!shift) {
      return res.status(404).send({ message: `Shift not found.` });
    }
    
    // Update shift with assigned user
    await shift.update({
      userId: userId,
      updatedAt: Date.now()
    });
    
    res.send({ message: "User assigned to shift successfully.", shift });
    
  } catch (err) {
    console.error('Error assigning user to shift:', err);
    res.status(500).send({ 
      message: err.message || "Error assigning user to shift." 
    });
  }
};

// Publish shift (change status to published)
export const publish = async (req, res) => {
  try {
    const id = req.params.id;
    
    const shift = await Shift.findByPk(id);
    if (!shift) {
      return res.status(404).send({ message: `Shift not found.` });
    }
    
    await shift.update({
      status: 'published',
      updatedAt: Date.now()
    });
    
    res.send({ message: "Shift published successfully.", shift });
    
  } catch (err) {
    console.error('Error publishing shift:', err);
    res.status(500).send({ 
      message: err.message || "Error publishing shift." 
    });
  }
};