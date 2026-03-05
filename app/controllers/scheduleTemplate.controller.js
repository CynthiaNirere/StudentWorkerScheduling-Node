import db from "../models/index.js";

const ScheduleTemplate = db.scheduleTemplate;
const Shift = db.shift;
const { Op } = db.Sequelize;

// Create and Save a new Schedule Template
export const create = async (req, res) => {
  try {
    console.log("Creating schedule template with data:", req.body);
    
    if (!req.body.name || !req.body.templateData) {
      return res.status(400).send({ message: "Name and template data are required!" });
    }
    
    const template = await ScheduleTemplate.create({
      name: req.body.name,
      description: req.body.description || null,
      createdBy: req.user?.id || 'system',
      locationId: req.body.locationId || null,
      templateData: JSON.stringify(req.body.templateData),  // Store as JSON string
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      createdAt: Date.now(),
      updatedAt: null
    });
    
    console.log("Template created with ID:", template.id);
    res.status(201).send(template);
    
  } catch (err) {
    console.error("Error creating schedule template:", err.message);
    res.status(500).send({
      message: err.message || "Error creating schedule template.",
      error: err.message
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
    
    // Parse templateData for each template
    const templatesWithParsedData = templates.map(t => ({
      ...t.toJSON(),
      templateData: typeof t.templateData === 'string' ? JSON.parse(t.templateData) : t.templateData
    }));
    
    res.send(templatesWithParsedData);
  } catch (err) {
    console.error("Error retrieving schedule templates:", err);
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
    const templateWithParsedData = {
      ...template.toJSON(),
      templateData: typeof template.templateData === 'string' ? JSON.parse(template.templateData) : template.templateData
    };
    
    res.send(templateWithParsedData);
  } catch (err) {
    console.error("Error retrieving schedule template:", err);
    res.status(500).send({ message: "Error retrieving schedule template." });
  }
};

// Update a Schedule Template
export const update = async (req, res) => {
  try {
    const id = req.params.id;
    
    // If templateData is provided, stringify it
    if (req.body.templateData) {
      req.body.templateData = JSON.stringify(req.body.templateData);
    }
    
    req.body.updatedAt = Date.now();
    
    const [updated] = await ScheduleTemplate.update(req.body, { where: { id: id } });
    
    if (updated === 1) {
      res.send({ message: "Schedule template updated successfully." });
    } else {
      res.status(404).send({ message: `Schedule template not found or no data changed.` });
    }
  } catch (err) {
    console.error("Error updating schedule template:", err);
    res.status(500).send({ message: "Error updating schedule template." });
  }
};

// Delete a Schedule Template
export const remove = async (req, res) => {
  try {
    const id = req.params.id;
    
    console.log(`Deleting schedule template ${id}...`);
    
    const template = await ScheduleTemplate.findByPk(id);
    if (!template) {
      return res.status(404).send({ message: `Schedule template not found.` });
    }
    
    const deleted = await ScheduleTemplate.destroy({ where: { id: id } });
    
    if (deleted) {
      console.log('Schedule template deleted successfully');
      return res.send({ message: "Schedule template deleted successfully." });
    }
    
    return res.status(404).send({ message: `Schedule template not found.` });
    
  } catch (err) {
    console.error('Error deleting schedule template:', err);
    res.status(500).send({ 
      message: err.message || "Error deleting schedule template." 
    });
  }
};

// Apply Template to a Specific Week
export const applyToWeek = async (req, res) => {
  try {
    const id = req.params.id;
    const { startDate } = req.body;
    
    if (!startDate) {
      return res.status(400).send({ message: "Start date (Sunday timestamp) is required!" });
    }
    
    console.log(`Applying template ${id} to week starting ${new Date(Number(startDate)).toDateString()}`);
    
    const template = await ScheduleTemplate.findByPk(id);
    if (!template) {
      return res.status(404).send({ message: "Schedule template not found!" });
    }
    
    // ✅ FIX: Parse templateData if it's a string
    let templateData;
    if (typeof template.templateData === 'string') {
      templateData = JSON.parse(template.templateData);
    } else {
      templateData = template.templateData;
    }
    
    console.log(`Template has ${templateData.length} shifts to create`);
    
    const startTimestamp = Number(startDate);
    
    // Create shifts for the week
    const shifts = templateData.map(shiftTemplate => {
      // Calculate the actual date for this shift
      const shiftDate = new Date(startTimestamp);
      shiftDate.setDate(shiftDate.getDate() + shiftTemplate.dayOfWeek);
      shiftDate.setHours(12, 0, 0, 0); // Noon local time (timezone fix)
      
      return {
        shiftTime: shiftDate.getTime(),
        startTime: shiftTemplate.startTime,
        endTime: shiftTemplate.endTime,
        jobRoleId: shiftTemplate.jobRoleId,
        notes: shiftTemplate.notes || `From template: ${template.name}`,
        userId: null,  // Unassigned initially
        status: 'draft',
        locationId: template.locationId,
        createdBy: req.user?.id || 'system',
        createdAt: Date.now()
      };
    });
    
    console.log(`Created ${shifts.length} shift objects, ready to insert`);
    
    res.send({ 
      message: "Template applied successfully!",
      shifts: shifts,
      count: shifts.length
    });
    
  } catch (err) {
    console.error("Error applying template:", err);
    res.status(500).send({ 
      message: "Error applying template to week.",
      error: err.message
    });
  }
};