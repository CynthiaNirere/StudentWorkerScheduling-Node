import db from "../models/index.js";
import crypto from "crypto";

const User = db.user;
const { Op } = db.Sequelize;

// Create and Save a new User
export const create = async (req, res) => {
  try {
    console.log("Creating user with data:", req.body);
    
    if (!req.body.fName || !req.body.email) {
      return res.status(400).send({ message: "Required fields missing!" });
    }
    
    // Check if email already exists
    const existingUser = await User.findOne({ where: { email: req.body.email } });
    if (existingUser) {
      return res.status(400).send({ message: "Email already exists" });
    }
    
    const now = Date.now();
    
    // Create user with generated UUID
    const user = await User.create({
      id: crypto.randomUUID(),
      fName: req.body.fName,
      lName: req.body.lName,
      email: req.body.email,
      password_hash: req.body.password_hash || req.body.password || null,
      role: req.body.role || "employee",
      createdAt: now,
    });
    
    console.log("User created with ID:", user.id);
    res.status(201).send(user);
    
  } catch (err) {
    console.error("Error creating user:", err.message);
    res.status(500).send({
      message: err.message || "Error creating user.",
    });
  }
};

// Retrieve all Users
export const findAll = async (req, res) => {
  try {
    const id = req.query.id;
    const condition = id ? { id: { [Op.like]: `%${id}%` } } : undefined;
    const users = await User.findAll({ where: condition });
    res.send(users);
  } catch (err) {
    console.error("Error retrieving users:", err);
    res.status(500).send({ message: "Error retrieving users." });
  }
};

// Find one User by ID
export const findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findByPk(id);
    if (!user)
      return res.status(404).send({ message: `User not found with id=${id}` });
    res.send(user);
  } catch (err) {
    console.error("Error retrieving user:", err);
    res.status(500).send({ message: "Error retrieving user." });
  }
};

// Find by email
export const findByEmail = async (req, res) => {
  try {
    const email = req.params.email;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).send({ message: "Email not found." });
    res.send(user);
  } catch (err) {
    console.error("Error retrieving user by email:", err);
    res.status(500).send({ message: "Error retrieving user by email." });
  }
};

// Update a User
export const update = async (req, res) => {
  try {
    const id = req.params.id;
    const { fName, lName, email, role, phoneNumber, workLocation } = req.body;
    const [updated] = await User.update(
      { fName, lName, email, role, phoneNumber, workLocation, updatedAt: Date.now() },
      { where: { id: id } }
    );
    if (updated === 1)
      res.send({ message: "User updated successfully." });
    else
      res.status(404).send({ message: `User not found or no data changed.` });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).send({ message: "Error updating user." });
  }
};

// Delete a User
export const remove = async (req, res) => {
  try {
    const id = req.params.id;
    
    console.log(`Deleting user ${id} and all related records...`);
    
    // Check if user exists first
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).send({ message: `User not found.` });
    }
    
    // Delete related records first (foreign key constraints)
    await db.session.destroy({ where: { userId: id } });
    await db.availability.destroy({ where: { userId: id } });
    await db.clock.destroy({ where: { userId: id } });
    console.log('Deleted related records for user', id);
    
    // Now delete the user
    const deleted = await User.destroy({ where: { id: id } });
    
    if (deleted) {
      console.log('User deleted successfully');
      return res.send({ message: "User deleted successfully." });
    }
    
    return res.status(404).send({ message: `User not found.` });
    
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).send({ 
      message: err.message || "Error deleting user." 
    });
  }
};