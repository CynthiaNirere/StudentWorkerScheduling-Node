import db from "../models/index.js";

const Session = db.session;
const User = db.user;
const { Op } = db.Sequelize;

// Create and Save a new Session
export const create = async (req, res) => {
  try {
    console.log(" Creating session with data:", req.body);
    
    if (!req.body.user_id || !req.body.token) {
      return res.status(400).send({ message: "user_id and token are required!" });
    }
    
    const session = await Session.create({
      user_id: req.body.user_id,
      token: req.body.token,
      created_at: Date.now(),
      is_active: 1,
      expires_at: req.body.expires_at || null
    });
    
    console.log(" Session created with ID:", session.session_id);
    res.status(201).send(session);
    
  } catch (err) {
    console.error(" Error creating session:", err.message);
    console.error("Stack:", err.stack);
    res.status(500).send({
      message: err.message || "Error creating session.",
      error: err.message
    });
  }
};

// Retrieve all Sessions
export const findAll = async (req, res) => {
  try {
    const user_id = req.query.user_id;
    const condition = user_id ? { user_id: user_id } : undefined;
    const sessions = await Session.findAll({ where: condition });
    res.send(sessions);
  } catch (err) {
    console.error(" Error retrieving sessions:", err);
    res.status(500).send({ message: "Error retrieving sessions." });
  }
};

// Find one Session by ID
export const findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const session = await Session.findByPk(id);
    if (!session)
      return res.status(404).send({ message: `Session not found with id=${id}` });
    res.send(session);
  } catch (err) {
    console.error(" Error retrieving session:", err);
    res.status(500).send({ message: "Error retrieving session." });
  }
};

// Find by token
export const findByToken = async (req, res) => {
  try {
    const token = req.params.token;
    const session = await Session.findOne({ where: { token } });
    if (!session) return res.status(404).send({ message: "Session not found." });
    res.send(session);
  } catch (err) {
    console.error(" Error retrieving session by token:", err);
    res.status(500).send({ message: "Error retrieving session by token." });
  }
};

// Update a Session
export const update = async (req, res) => {
  try {
    const id = req.params.id;
    const [updated] = await Session.update(req.body, { where: { session_id: id } });
    if (updated === 1)
      res.send({ message: "Session updated successfully." });
    else
      res.status(404).send({ message: `Session not found or no data changed.` });
  } catch (err) {
    console.error(" Error updating session:", err);
    res.status(500).send({ message: "Error updating session." });
  }
};

// Delete a Session
export const remove = async (req, res) => {
  try {
    const id = req.params.id;
    
    console.log(`🗑️ Deleting session ${id}...`);
    
    // Check if session exists first
    const session = await Session.findByPk(id);
    if (!session) {
      return res.status(404).send({ message: `Session not found.` });
    }
    
    // Now delete the session
    const deleted = await Session.destroy({ where: { session_id: id } });
    
    if (deleted) {
      console.log(' Session deleted successfully');
      return res.send({ message: "Session deleted successfully." });
    }
    
    return res.status(404).send({ message: `Session not found.` });
    
  } catch (err) {
    console.error(' Error deleting session:', err);
    console.error('Error message:', err.message);
    res.status(500).send({ 
      message: err.message || "Error deleting session." 
    });
  }
};