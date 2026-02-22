import db from "../models/index.js";

const Shift = db.Shift;
const User = db.user;
const { Op } = db.Sequelize;

// Create and Save a new Shift
export const create = async (req, res) => {
  try {
    console.log("📝 Creating shift with data:", req.body);
    console.log("📝 User from auth:", req.user);
    
    // Accept both naming conventions for fields
    const shiftTime = req.body.shiftTime || req.body.shift_time;
    const startTime = req.body.startTime || req.body.start_time;
    const endTime = req.body.endTime || req.body.end_time;
    const locationId = req.body.locationId || req.body.location_id;
    const jobRoleId = req.body.jobRoleId || req.body.job_role_id;
    const userId = req.body.userId || req.body.user_id;
    const notes = req.body.notes;
    const status = req.body.status || 'draft';
    
    if (!shiftTime || !startTime || !endTime || !locationId || !jobRoleId) {
      return res.status(400).send({ message: "Required fields missing!" });
    }
    
    // FIXED: Get createdBy from multiple possible sources
    let createdBy = 'system';
    if (req.user) {
      createdBy = req.user.userId || req.user.user_id || req.user.id;
    } else if (req.body.createdBy) {
      createdBy = req.body.createdBy;
    }
    
    console.log("✅ Using createdBy:", createdBy);
    
    const shift = await Shift.create({
      shiftTime: shiftTime,
      startTime: startTime,
      endTime: endTime,
      createdBy: createdBy,
      notes: notes || null,
      userId: userId || null,
      dayOfWeek: req.body.dayOfWeek || null,
      minimumWorkers: req.body.minimumWorkers || 1,
      maximumWorkers: req.body.maximumWorkers || 1,
      locationId: locationId,
      jobRoleId: jobRoleId,
      status: status,
      createdAt: Date.now(),
      updatedAt: null
    });
    
    console.log("✅ Shift created with ID:", shift.id);
    
    // Return with both naming conventions
    const responseData = {
      shift_id: shift.id,
      shiftId: shift.id,
      shift_time: shift.shiftTime,
      shiftTime: shift.shiftTime,
      start_time: shift.startTime,
      startTime: shift.startTime,
      end_time: shift.endTime,
      endTime: shift.endTime,
      user_id: shift.userId,
      userId: shift.userId,
      location_id: shift.locationId,
      locationId: shift.locationId,
      job_role_id: shift.jobRoleId,
      jobRoleId: shift.jobRoleId,
      status: shift.status,
      notes: shift.notes,
      created_at: shift.createdAt,
      createdAt: shift.createdAt
    };
    
    res.status(201).send(responseData);
    
  } catch (err) {
    console.error("❌ Error creating shift:", err);
    res.status(500).send({
      message: err.message || "Error creating shift.",
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// Retrieve all Shifts with optional filters
export const findAll = async (req, res) => {
  try {
    const { locationId, location_id, userId, user_id, status, startDate, start, endDate, end } = req.query;
    
    let condition = {};
    
    // Handle both naming conventions in query params
    if (locationId || location_id) {
      condition.locationId = locationId || location_id;
    }
    
    if (userId || user_id) {
      condition.userId = userId || user_id;
    }
    
    if (status) {
      condition.status = status;
    }
    
    const startDateValue = startDate || start;
    const endDateValue = endDate || end;
    
    if (startDateValue && endDateValue) {
      condition.shiftTime = {
        [Op.between]: [parseInt(startDateValue), parseInt(endDateValue)]
      };
    }
    
    const shifts = await Shift.findAll({ 
      where: condition,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fName', 'lName', 'email'],
          required: false
        }
      ]
    });
    
    // Format response with both naming conventions
    const formattedShifts = shifts.map(shift => {
      const user = shift.user;
      return {
        shift_id: shift.id,
        shiftId: shift.id,
        shift_time: shift.shiftTime,
        shiftTime: shift.shiftTime,
        start_time: shift.startTime,
        startTime: shift.startTime,
        end_time: shift.endTime,
        endTime: shift.endTime,
        user_id: shift.userId,
        userId: shift.userId,
        location_id: shift.locationId,
        locationId: shift.locationId,
        job_role_id: shift.jobRoleId,
        jobRoleId: shift.jobRoleId,
        status: shift.status,
        notes: shift.notes,
        created_at: shift.createdAt,
        employee_name: user ? `${user.fName} ${user.lName}` : null,
        employeeName: user ? `${user.fName} ${user.lName}` : null,
      };
    });
    
    res.send(formattedShifts);
  } catch (err) {
    console.error("❌ Error retrieving shifts:", err);
    res.status(500).send({ message: "Error retrieving shifts." });
  }
};

// Find one Shift by ID
export const findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const shift = await Shift.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fName', 'lName', 'email'],
          required: false
        }
      ]
    });
    
    if (!shift) {
      return res.status(404).send({ message: `Shift not found with id=${id}` });
    }
    
    const user = shift.user;
    const responseData = {
      shift_id: shift.id,
      shiftId: shift.id,
      shift_time: shift.shiftTime,
      shiftTime: shift.shiftTime,
      start_time: shift.startTime,
      startTime: shift.startTime,
      end_time: shift.endTime,
      endTime: shift.endTime,
      user_id: shift.userId,
      userId: shift.userId,
      location_id: shift.locationId,
      locationId: shift.locationId,
      job_role_id: shift.jobRoleId,
      jobRoleId: shift.jobRoleId,
      status: shift.status,
      notes: shift.notes,
      created_at: shift.createdAt,
      employee_name: user ? `${user.fName} ${user.lName}` : null,
      employeeName: user ? `${user.fName} ${user.lName}` : null,
    };
    
    res.send(responseData);
  } catch (err) {
    console.error("❌ Error retrieving shift:", err);
    res.status(500).send({ message: "Error retrieving shift." });
  }
};

// Update a Shift
export const update = async (req, res) => {
  try {
    const id = req.params.id;
    
    const updateData = {};
    
    // Accept both naming conventions
    if (req.body.shiftTime || req.body.shift_time) {
      updateData.shiftTime = req.body.shiftTime || req.body.shift_time;
    }
    if (req.body.startTime || req.body.start_time) {
      updateData.startTime = req.body.startTime || req.body.start_time;
    }
    if (req.body.endTime || req.body.end_time) {
      updateData.endTime = req.body.endTime || req.body.end_time;
    }
    if (req.body.userId !== undefined || req.body.user_id !== undefined) {
      updateData.userId = req.body.userId || req.body.user_id;
    }
    if (req.body.locationId || req.body.location_id) {
      updateData.locationId = req.body.locationId || req.body.location_id;
    }
    if (req.body.jobRoleId || req.body.job_role_id) {
      updateData.jobRoleId = req.body.jobRoleId || req.body.job_role_id;
    }
    if (req.body.status) {
      updateData.status = req.body.status;
    }
    if (req.body.notes !== undefined) {
      updateData.notes = req.body.notes;
    }
    
    updateData.updatedAt = Date.now();
    
    const [updated] = await Shift.update(updateData, { where: { id: id } });
    
    if (updated === 1) {
      const shift = await Shift.findByPk(id);
      res.send({ 
        message: "Shift updated successfully.",
        shift: {
          shift_id: shift.id,
          status: shift.status,
          updated_at: shift.updatedAt
        }
      });
    } else {
      res.status(404).send({ message: `Shift not found or no data changed.` });
    }
  } catch (err) {
    console.error("❌ Error updating shift:", err);
    res.status(500).send({ message: "Error updating shift." });
  }
};

// Delete a Shift
export const remove = async (req, res) => {
  try {
    const id = req.params.id;
    
    console.log(`🗑️ Deleting shift ${id}...`);
    
    const shift = await Shift.findByPk(id);
    if (!shift) {
      return res.status(404).send({ message: `Shift not found.` });
    }
    
    const deleted = await Shift.destroy({ where: { id: id } });
    
    if (deleted) {
      console.log('✅ Shift deleted successfully');
      return res.send({ message: "Shift deleted successfully." });
    }
    
    return res.status(404).send({ message: `Shift not found.` });
    
  } catch (err) {
    console.error('❌ Error deleting shift:', err);
    res.status(500).send({ 
      message: err.message || "Error deleting shift." 
    });
  }
};

// Assign user to shift
export const assignUser = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.body.userId || req.body.user_id;
    
    if (!userId) {
      return res.status(400).send({ message: "User ID is required!" });
    }
    
    const shift = await Shift.findByPk(id);
    if (!shift) {
      return res.status(404).send({ message: `Shift not found.` });
    }
    
    await shift.update({
      userId: userId,
      updatedAt: Date.now()
    });
    
    res.send({ message: "User assigned to shift successfully.", shift });
    
  } catch (err) {
    console.error('❌ Error assigning user to shift:', err);
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
    console.error('❌ Error publishing shift:', err);
    res.status(500).send({ 
      message: err.message || "Error publishing shift." 
    });
  }
};