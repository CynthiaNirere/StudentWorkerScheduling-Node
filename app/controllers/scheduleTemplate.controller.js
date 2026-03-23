import db from "../models/index.js";

const ScheduleTemplate = db.scheduleTemplate;
const Shift = db.Shift || db.shift; // Handle both naming conventions
const { Op } = db.Sequelize;

// Create and Save a new Schedule Template
export const create = async (req, res) => {
  try {
    console.log("📝 Creating schedule template with data:", req.body);
    
    if (!req.body.name || !req.body.templateData) {
      return res.status(400).send({ message: "Name and template data are required!" });
    }
    
    // Handle both plain object and already-stringified JSON
    let templateDataString;
    if (typeof req.body.templateData === 'string') {
      // Validate it's valid JSON
      JSON.parse(req.body.templateData);
      templateDataString = req.body.templateData;
    } else {
      templateDataString = JSON.stringify(req.body.templateData);
    }
    
    // Get createdBy from multiple sources
    let createdBy = 'system';
    if (req.user) {
      createdBy = req.user.userId || req.user.user_id || req.user.id;
    } else if (req.body.createdBy) {
      createdBy = req.body.createdBy;
    }
    
    const template = await ScheduleTemplate.create({
      name: req.body.name,
      description: req.body.description || null,
      createdBy: createdBy,
      locationId: req.body.locationId || null,
      templateData: templateDataString,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      createdAt: Date.now(),
      updatedAt: null
    });
    
    console.log("✅ Template created with ID:", template.id);
    
    // Return with parsed templateData for consistency
    const responseData = {
      template_id: template.id,
      templateId: template.id,
      name: template.name,
      description: template.description,
      created_by: template.createdBy,
      createdBy: template.createdBy,
      location_id: template.locationId,
      locationId: template.locationId,
      template_data: JSON.parse(templateDataString),
      templateData: JSON.parse(templateDataString),
      is_active: template.isActive,
      isActive: template.isActive,
      created_at: template.createdAt,
      createdAt: template.createdAt
    };
    
    res.status(201).send(responseData);
    
  } catch (err) {
    console.error("❌ Error creating schedule template:", err.message);
    res.status(500).send({
      message: err.message || "Error creating schedule template.",
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// Retrieve all Schedule Templates
export const findAll = async (req, res) => {
  try {
    const { locationId, isActive } = req.query;
    
    let condition = {};
    
    if (locationId) {
      condition.locationId = locationId;
    }
    
    if (isActive !== undefined) {
      condition.isActive = isActive === 'true';
    }
    
    const templates = await ScheduleTemplate.findAll({ 
      where: condition,
      order: [['createdAt', 'DESC']]
    });
    
    // Parse templateData for each template and provide both naming conventions
    const templatesWithParsedData = templates.map(t => {
      const parsed = typeof t.templateData === 'string' ? JSON.parse(t.templateData) : t.templateData;
      return {
        template_id: t.id,
        templateId: t.id,
        name: t.name,
        description: t.description,
        created_by: t.createdBy,
        createdBy: t.createdBy,
        location_id: t.locationId,
        locationId: t.locationId,
        template_data: parsed,
        templateData: parsed,
        is_active: t.isActive,
        isActive: t.isActive,
        created_at: t.createdAt,
        createdAt: t.createdAt,
        updated_at: t.updatedAt,
        updatedAt: t.updatedAt
      };
    });
    
    res.send(templatesWithParsedData);
  } catch (err) {
    console.error("❌ Error retrieving schedule templates:", err);
    res.status(500).send({ message: "Error retrieving schedule templates." });
  }
};

// Find one Schedule Template by ID
export const findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const template = await ScheduleTemplate.findByPk(id);
    
    if (!template) {
      return res.status(404).send({ message: `Schedule template not found with id=${id}` });
    }
    
    // Parse templateData
    const parsed = typeof template.templateData === 'string' ? JSON.parse(template.templateData) : template.templateData;
    
    const responseData = {
      template_id: template.id,
      templateId: template.id,
      name: template.name,
      description: template.description,
      created_by: template.createdBy,
      createdBy: template.createdBy,
      location_id: template.locationId,
      locationId: template.locationId,
      template_data: parsed,
      templateData: parsed,
      is_active: template.isActive,
      isActive: template.isActive,
      created_at: template.createdAt,
      createdAt: template.createdAt,
      updated_at: template.updatedAt,
      updatedAt: template.updatedAt
    };
    
    res.send(responseData);
  } catch (err) {
    console.error("❌ Error retrieving schedule template:", err);
    res.status(500).send({ message: "Error retrieving schedule template." });
  }
};

// Update a Schedule Template
export const update = async (req, res) => {
  try {
    const id = req.params.id;
    
    const updateData = {};
    
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;
    
    // If templateData is provided, stringify it
    if (req.body.templateData) {
      if (typeof req.body.templateData === 'string') {
        updateData.templateData = req.body.templateData;
      } else {
        updateData.templateData = JSON.stringify(req.body.templateData);
      }
    }
    
    updateData.updatedAt = Date.now();
    
    const [updated] = await ScheduleTemplate.update(updateData, { where: { id: id } });
    
    if (updated === 1) {
      res.send({ message: "Schedule template updated successfully." });
    } else {
      res.status(404).send({ message: `Schedule template not found or no data changed.` });
    }
  } catch (err) {
    console.error("❌ Error updating schedule template:", err);
    res.status(500).send({ message: "Error updating schedule template." });
  }
};

// Delete a Schedule Template
export const remove = async (req, res) => {
  try {
    const id = req.params.id;
    
    console.log(`🗑️ Deleting schedule template ${id}...`);
    
    const template = await ScheduleTemplate.findByPk(id);
    if (!template) {
      return res.status(404).send({ message: `Schedule template not found.` });
    }
    
    const deleted = await ScheduleTemplate.destroy({ where: { id: id } });
    
    if (deleted) {
      console.log('✅ Schedule template deleted successfully');
      return res.send({ message: "Schedule template deleted successfully." });
    }
    
    return res.status(404).send({ message: `Schedule template not found.` });
    
  } catch (err) {
    console.error('❌ Error deleting schedule template:', err);
    res.status(500).send({ 
      message: err.message || "Error deleting schedule template." 
    });
  }
};

// ✅ FIXED: Apply Template to a Specific Week - ACTUALLY CREATES SHIFTS IN DATABASE
export const applyToWeek = async (req, res) => {
  try {
    const id = req.params.id;
    const { startDate } = req.body;
    
    if (!startDate) {
      return res.status(400).send({ message: "Start date (Sunday timestamp) is required!" });
    }
    
    console.log(`📅 Applying template ${id} to week starting ${new Date(Number(startDate)).toDateString()}`);
    
    const template = await ScheduleTemplate.findByPk(id);
    if (!template) {
      return res.status(404).send({ message: "Schedule template not found!" });
    }
    
    // Parse templateData if it's a string
    let templateData;
    if (typeof template.templateData === 'string') {
      templateData = JSON.parse(template.templateData);
    } else {
      templateData = template.templateData;
    }
    
    console.log(`📋 Template has ${templateData.length} shifts to create`);
    
    const startTimestamp = Number(startDate);
    
    // Get createdBy from multiple sources
    let createdBy = 'system';
    if (req.user) {
      createdBy = req.user.userId || req.user.user_id || req.user.id;
    } else if (req.body.createdBy) {
      createdBy = req.body.createdBy;
    }
    
    // ✅ CREATE SHIFTS IN DATABASE (not just return them!)
    const createdShifts = [];
    
    for (const shiftTemplate of templateData) {
      // Calculate the actual date for this shift
      const shiftDate = new Date(startTimestamp);
      shiftDate.setDate(shiftDate.getDate() + shiftTemplate.dayOfWeek);
      shiftDate.setHours(12, 0, 0, 0); // Noon local time (timezone fix)
      
      const shiftData = {
        shiftTime: shiftDate.getTime(),
        startTime: shiftTemplate.startTime,
        endTime: shiftTemplate.endTime,
        jobRoleId: shiftTemplate.jobRoleId,
        notes: shiftTemplate.notes || `From template: ${template.name}`,
        userId: null,  // Unassigned initially
        status: 'draft',
        locationId: template.locationId,
        createdBy: createdBy,
        createdAt: Date.now(),
        updatedAt: null,
        dayOfWeek: shiftTemplate.dayOfWeek,
        minimumWorkers: 1,
        maximumWorkers: 1
      };
      
      try {
        const newShift = await Shift.create(shiftData);
        createdShifts.push(newShift);
        console.log(`✅ Created shift ${newShift.id} for ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][shiftTemplate.dayOfWeek]}`);
      } catch (shiftErr) {
        console.error(`❌ Error creating shift for day ${shiftTemplate.dayOfWeek}:`, shiftErr.message);
      }
    }
    
    console.log(`✅ Successfully created ${createdShifts.length} shifts from template`);
    
    // Return created shifts with both naming conventions
    const formattedShifts = createdShifts.map(shift => ({
      shift_id: shift.id,
      shiftId: shift.id,
      shift_time: shift.shiftTime,
      shiftTime: shift.shiftTime,
      start_time: shift.startTime,
      startTime: shift.startTime,
      end_time: shift.endTime,
      endTime: shift.endTime,
      job_role_id: shift.jobRoleId,
      jobRoleId: shift.jobRoleId,
      location_id: shift.locationId,
      locationId: shift.locationId,
      user_id: shift.userId,
      userId: shift.userId,
      status: shift.status,
      notes: shift.notes,
      created_at: shift.createdAt,
      createdAt: shift.createdAt
    }));
    
    res.send({ 
      message: `Template applied successfully! Created ${createdShifts.length} shifts.`,
      shifts: formattedShifts,
      count: createdShifts.length
    });
    
  } catch (err) {
    console.error("❌ Error applying template:", err);
    res.status(500).send({ 
      message: "Error applying template to week.",
      error: err.message
    });
  }
};