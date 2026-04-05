import db from "../models/index.js";

const JobRole = db.jobRole;
const BusinessArea = db.businessArea;
const { Op } = db.Sequelize;

// Create and Save a new Job Role
export const create = async (req, res) => {
  try {
    if (!req.body.title || !req.body.location_id) {
      return res.status(400).send({ message: "Title and location_id are required!" });
    }
    
    const jobRole = await JobRole.create({
      title: req.body.title,
      description: req.body.description || null,
      location_id: req.body.location_id,
      created_at: Date.now()
    });
    
    res.status(201).send(jobRole);
    
  } catch (err) {
    console.error("Error creating job role:", err.message);
    res.status(500).send({
      message: err.message || "Error creating job role.",
      error: err.message
    });
  }
};

// Retrieve all Job Roles (scoped by employer's work_location)
export const findAll = async (req, res) => {
  try {
    const condition = {};

    // Explicit query param takes precedence
    if (req.query.location_id) {
      condition.location_id = req.query.location_id;
    } else if (req.workLocation && req.userRole !== 'admin') {
      condition.location_id = req.workLocation;
    }

    const jobRoles = await JobRole.findAll({ 
      where: condition,
      include: [{
        model: BusinessArea,
        as: 'location'
      }]
    });
    res.send(jobRoles);
  } catch (err) {
    console.error("Error retrieving job roles:", err);
    res.status(500).send({ message: "Error retrieving job roles." });
  }
};

// Find one Job Role by ID
export const findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const jobRole = await JobRole.findByPk(id, {
      include: [{
        model: BusinessArea,
        as: 'location'
      }]
    });
    if (!jobRole)
      return res.status(404).send({ message: `Job role not found with id=${id}` });
    res.send(jobRole);
  } catch (err) {
    console.error("Error retrieving job role:", err);
    res.status(500).send({ message: "Error retrieving job role." });
  }
};

// Update a Job Role
export const update = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Add updated_at timestamp
    const updateData = {
      ...req.body,
      updated_at: Date.now()
    };
    
    const [updated] = await JobRole.update(updateData, { where: { job_role_id: id } });
    if (updated === 1)
      res.send({ message: "Job role updated successfully." });
    else
      res.status(404).send({ message: `Job role not found or no data changed.` });
  } catch (err) {
    console.error("Error updating job role:", err);
    res.status(500).send({ message: "Error updating job role." });
  }
};

// Delete a Job Role
export const remove = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Check if job role exists first
    const jobRole = await JobRole.findByPk(id);
    if (!jobRole) {
      return res.status(404).send({ message: `Job role not found.` });
    }
    
    // Now delete the job role
    const deleted = await JobRole.destroy({ where: { job_role_id: id } });
    
    if (deleted) {
      return res.send({ message: "Job role deleted successfully." });
    }
    
    return res.status(404).send({ message: `Job role not found.` });
    
  } catch (err) {
    console.error('Error deleting job role:', err);
    res.status(500).send({ 
      message: err.message || "Error deleting job role." 
    });
  }
};