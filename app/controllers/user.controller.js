import db from "../models/index.js";

const User = db.user;
const AthleteProfile = db.athleteProfile;
const { Op } = db.Sequelize;

// Create and Save a new User
export const create = async (req, res) => {
  try {
    console.log(" Creating user with data:", req.body);
    
    if (!req.body.fName || !req.body.email) {
      return res.status(400).send({ message: "Required fields missing!" });
    }
    
    // Check if email already exists
    const existingUser = await User.findOne({ where: { email: req.body.email } });
    if (existingUser) {
      return res.status(400).send({ message: "Email already exists" });
    }
    
    // Create user
    const user = await User.create({
      fName: req.body.fName,
      lName: req.body.lName,
      email: req.body.email,
      password_hash: req.body.password_hash || req.body.password || null,
      role: req.body.role || "athlete",
    });
    
    console.log("User created with ID:", user.id);
    
    // If athlete, create athlete profile
    if (user.role === 'athlete' && (req.body.age || req.body.gender || req.body.sport_type || req.body.team || req.body.bio || req.body.coachId)) {
      try {
        await AthleteProfile.create({
          athleteId: user.id,
          coachId: req.body.coachId || null,
          age: req.body.age || null,
          gender: req.body.gender || null,
          team: req.body.team || null,
          sportType: req.body.sport_type || null,
          bio: req.body.bio || null
        });
        console.log(" Athlete profile created");
      } catch (profileError) {
        console.error(" Error creating athlete profile:", profileError.message);
        // Continue anyway - profile can be created later
      }
    }
    
    // Return formatted user data
    const responseData = {
      user_id: user.id,
      first_name: user.fName,
      last_name: user.lName,
      email: user.email,
      role: user.role,
      age: req.body.age || null,
      gender: req.body.gender || null,
      team: req.body.team || null,
      sport_type: req.body.sport_type || null,
      bio: req.body.bio || null,
      totalWorkouts: 0
    };
    
    console.log(" Returning user data:", responseData);
    res.status(201).send(responseData);
    
  } catch (err) {
    console.error(" Error creating user:", err.message);
    console.error("Stack:", err.stack);
    res.status(500).send({
      message: err.message || "Error creating user.",
      error: err.message
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
    const [updated] = await User.update(req.body, { where: { id: id } });
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
    // 1. Delete athlete profile
    await db.athleteProfile.destroy({ where: { athleteId: id } });
    console.log('Deleted athlete profile');
    
    // 2. Delete coach profile
    await db.coach.destroy({ where: { coachId: id } });
    console.log('Deleted coach profile');
    
    // 3. Delete goals
    await db.goal.destroy({ where: { athleteId: id } });
    console.log('Deleted goals');
    
    // 4. Delete exercise results
    await db.exerciseResult.destroy({ where: { athleteId: id } });
    console.log('Deleted exercise results');
    
    // 5. Delete athlete plans
    await db.athletePlan.destroy({ where: { athleteId: id } });
    console.log('Deleted athlete plans');
    
    // 6. Delete sessions
    await db.session.destroy({ where: { userId: id } });
    console.log('Deleted sessions');
    
    // 7. Now delete the user
    const deleted = await User.destroy({ where: { id: id } });
    
    if (deleted) {
      console.log(' User deleted successfully');
      return res.send({ message: "User deleted successfully." });
    }
    
    return res.status(404).send({ message: `User not found.` });
    
  } catch (err) {
    console.error(' Error deleting user:', err);
    console.error('Error message:', err.message);
    res.status(500).send({ 
      message: err.message || "Error deleting user." 
    });
  }
};