import db from "../models/index.js";

const BusinessArea = db.businessArea;
const JobRole = db.jobRole;
const { Op } = db.Sequelize;

// Create and Save a new Business Area
export const create = async (req, res) => {
  try {
    console.log("📝 Creating business area with data:", req.body);
    
    if (!req.body.name || !req.body.address) {
      return res.status(400).send({ message: "Name and address are required!" });
    }
    
    const businessArea = await BusinessArea.create({
      name: req.body.name,
      address: req.body.address,
      created_at: Date.now(),
      is_active: 1
    });
    
    console.log("✅ Business area created with ID:", businessArea.location_id);
    res.status(201).send(businessArea);
    
  } catch (err) {
    console.error("❌ Error creating business area:", err.message);
    console.error("Stack:", err.stack);
    res.status(500).send({
      message: err.message || "Error creating business area.",
      error: err.message
    });
  }
};

// Retrieve all Business Areas
export const findAll = async (req, res) => {
  try {
    const businessAreas = await BusinessArea.findAll({ 
      where: { is_active: 1 },
      include: [{
        model: JobRole,
        as: 'jobRoles'
      }]
    });
    res.send(businessAreas);
  } catch (err) {
    console.error("❌ Error retrieving business areas:", err);
    res.status(500).send({ message: "Error retrieving business areas." });
  }
};

// Find one Business Area by ID
export const findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const businessArea = await BusinessArea.findByPk(id, {
      include: [{
        model: JobRole,
        as: 'jobRoles'
      }]
    });
    if (!businessArea)
      return res.status(404).send({ message: `Business area not found with id=${id}` });
    res.send(businessArea);
  } catch (err) {
    console.error("❌ Error retrieving business area:", err);
    res.status(500).send({ message: "Error retrieving business area." });
  }
};

// Update a Business Area
export const update = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Add updated_at timestamp
    const updateData = {
      ...req.body,
      updated_at: Date.now()
    };
    
    const [updated] = await BusinessArea.update(updateData, { where: { location_id: id } });
    if (updated === 1)
      res.send({ message: "Business area updated successfully." });
    else
      res.status(404).send({ message: `Business area not found or no data changed.` });
  } catch (err) {
    console.error("❌ Error updating business area:", err);
    res.status(500).send({ message: "Error updating business area." });
  }
};

// Delete a Business Area (soft delete)
export const remove = async (req, res) => {
  try {
    const id = req.params.id;
    
    console.log(`🗑️ Soft deleting business area ${id}...`);
    
    // Check if business area exists first
    const businessArea = await BusinessArea.findByPk(id);
    if (!businessArea) {
      return res.status(404).send({ message: `Business area not found.` });
    }
    
    // Soft delete by setting is_active to 0
    const [updated] = await BusinessArea.update(
      { is_active: 0, updated_at: Date.now() },
      { where: { location_id: id } }
    );
    
    if (updated === 1) {
      console.log('✅ Business area deleted successfully');
      return res.send({ message: "Business area deleted successfully." });
    }
    
    return res.status(404).send({ message: `Business area not found.` });
    
  } catch (err) {
    console.error('❌ Error deleting business area:', err);
    console.error('Error message:', err.message);
    res.status(500).send({ 
      message: err.message || "Error deleting business area." 
    });
  }
};