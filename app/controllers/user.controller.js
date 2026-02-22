import db from "../models/index.js";

const User = db.user;
const { Op } = db.Sequelize;

// Create and Save a new User
export const create = async (req, res) => {
  try {
    console.log("📝 Creating user with data:", req.body);
    
    // Accept both naming conventions
    const firstName = req.body.firstName || req.body.first_name || req.body.fName;
    const lastName = req.body.lastName || req.body.last_name || req.body.lName;
    const email = req.body.email;
    const phoneNumber = req.body.phoneNumber || req.body.phone_number;
    const role = req.body.role || 'employee';
    const workLocation = req.body.workLocation || req.body.work_location;
    const password = req.body.password || req.body.password_hash;
    const age = req.body.age;
    const bio = req.body.bio;
    
    if (!firstName || !email) {
      return res.status(400).send({ 
        message: "First name and email are required!" 
      });
    }
    
    // Check if email already exists
    const existingUser = await User.findOne({ where: { email: email } });
    if (existingUser) {
      return res.status(400).send({ message: "Email already exists" });
    }
    
    // Generate user_id
    const rolePrefix = role === 'admin' ? 'admin' : role === 'employer' ? 'mgr' : 'emp';
    const timestamp = Date.now().toString().slice(-8);
    const randomStr = Math.random().toString(36).substr(2, 4);
    const user_id = `${rolePrefix}-${timestamp}-${randomStr}`;
    
    const user = await User.create({
      id: user_id,
      email: email,
      password_hash: password || 'TempPass123!',
      fName: firstName,
      lName: lastName || '',
      phone_number: phoneNumber || null,
      role: role,
      work_location: workLocation || null,
      age: age || null,
      bio: bio || null,
      createdAt: Date.now(),
      updatedAt: null
    });
    
    console.log("✅ User created with ID:", user.id);
    
    // Return BOTH naming conventions for compatibility
    const responseData = {
      user_id: user.id,
      userId: user.id,
      first_name: user.fName,
      last_name: user.lName,
      fName: user.fName,
      lName: user.lName,
      email: user.email,
      phone_number: user.phone_number,
      role: user.role,
      work_location: user.work_location,
      age: user.age,
      bio: user.bio,
      created_at: user.createdAt,
    };
    
    res.status(201).send(responseData);
    
  } catch (err) {
    console.error("❌ Error creating user:", err.message);
    res.status(500).send({
      message: err.message || "Error creating user.",
    });
  }
};

// Retrieve all Users
export const findAll = async (req, res) => {
  try {
    const role = req.query.role;
    const condition = role ? { role: { [Op.like]: `%${role}%` } } : undefined;
    
    const users = await User.findAll({ 
      where: condition,
      attributes: { exclude: ['password_hash'] }
    });
    
    // Return BOTH naming conventions
    const formattedUsers = users.map(user => ({
      user_id: user.id,
      userId: user.id,
      first_name: user.fName,
      last_name: user.lName,
      fName: user.fName,
      lName: user.lName,
      email: user.email,
      phone_number: user.phone_number,
      role: user.role,
      work_location: user.work_location,
      age: user.age,
      bio: user.bio,
      created_at: user.createdAt,
      updated_at: user.updatedAt
    }));
    
    res.send(formattedUsers);
  } catch (err) {
    console.error("❌ Error retrieving users:", err);
    res.status(500).send({ message: "Error retrieving users." });
  }
};

// Find one User by ID
export const findOne = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findOne({ 
      where: { id: userId },
      attributes: { exclude: ['password_hash'] }
    });
    
    if (!user) {
      return res.status(404).send({ message: `User not found with id=${userId}` });
    }
    
    const formattedUser = {
      user_id: user.id,
      userId: user.id,
      first_name: user.fName,
      last_name: user.lName,
      fName: user.fName,
      lName: user.lName,
      email: user.email,
      phone_number: user.phone_number,
      role: user.role,
      work_location: user.work_location,
      age: user.age,
      bio: user.bio,
      created_at: user.createdAt,
      updated_at: user.updatedAt
    };
    
    res.send(formattedUser);
  } catch (err) {
    console.error("❌ Error retrieving user:", err);
    res.status(500).send({ message: "Error retrieving user." });
  }
};

// Find user by email
export const findByEmail = async (req, res) => {
  try {
    const email = req.params.email;
    const user = await User.findOne({ 
      where: { email: email },
      attributes: { exclude: ['password_hash'] }
    });
    
    if (!user) {
      return res.status(404).send({ message: `User not found with email=${email}` });
    }
    
    const formattedUser = {
      user_id: user.id,
      userId: user.id,
      first_name: user.fName,
      last_name: user.lName,
      fName: user.fName,
      lName: user.lName,
      email: user.email,
      phone_number: user.phone_number,
      role: user.role,
      work_location: user.work_location,
      age: user.age,
      bio: user.bio,
      created_at: user.createdAt,
      updated_at: user.updatedAt
    };
    
    res.send(formattedUser);
  } catch (err) {
    console.error("❌ Error retrieving user by email:", err);
    res.status(500).send({ message: "Error retrieving user." });
  }
};

// Update a User
export const update = async (req, res) => {
  try {
    const userId = req.params.id;
    
    const updateData = {};
    
    // Accept both naming conventions
    if (req.body.firstName || req.body.first_name || req.body.fName) {
      updateData.fName = req.body.firstName || req.body.first_name || req.body.fName;
    }
    if (req.body.lastName || req.body.last_name || req.body.lName) {
      updateData.lName = req.body.lastName || req.body.last_name || req.body.lName;
    }
    if (req.body.email) {
      updateData.email = req.body.email;
    }
    if (req.body.phoneNumber || req.body.phone_number) {
      updateData.phone_number = req.body.phoneNumber || req.body.phone_number;
    }
    if (req.body.role) {
      updateData.role = req.body.role;
    }
    if (req.body.workLocation !== undefined || req.body.work_location !== undefined) {
      updateData.work_location = req.body.workLocation || req.body.work_location;
    }
    if (req.body.age !== undefined) {
      updateData.age = req.body.age;
    }
    if (req.body.bio !== undefined) {
      updateData.bio = req.body.bio;
    }
    
    updateData.updatedAt = Date.now();
    
    const [updated] = await User.update(updateData, { where: { id: userId } });
    
    if (updated === 1) {
      const user = await User.findOne({
        where: { id: userId },
        attributes: { exclude: ['password_hash'] }
      });
      
      res.send({ 
        message: "User updated successfully.",
        user: {
          user_id: user.id,
          userId: user.id,
          first_name: user.fName,
          last_name: user.lName,
          fName: user.fName,
          lName: user.lName,
          email: user.email,
          phone_number: user.phone_number,
          role: user.role,
          work_location: user.work_location,
          age: user.age,
          bio: user.bio
        }
      });
    } else {
      res.status(404).send({ message: `User not found or no data changed.` });
    }
  } catch (err) {
    console.error("❌ Error updating user:", err);
    res.status(500).send({ message: "Error updating user." });
  }
};

// Delete a User
export const remove = async (req, res) => {
  try {
    const userId = req.params.id;
    
    console.log(`🗑️ Deleting user ${userId} and all related records...`);
    
    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).send({ message: `User not found.` });
    }
    
    // Delete all related records using raw SQL queries to avoid FK constraint errors
    
    // 1. Delete sessions
    try {
      await db.sequelize.query(
        'DELETE FROM Session WHERE user_id = ?',
        { replacements: [user.id] }
      );
      console.log('✅ Deleted sessions');
    } catch (err) {
      console.log('⚠️ Sessions: ', err.message);
    }
    
    // 2. Delete availability
    try {
      await db.sequelize.query(
        'DELETE FROM Availability WHERE user_id = ?',
        { replacements: [user.id] }
      );
      console.log('✅ Deleted availability');
    } catch (err) {
      console.log('⚠️ Availability: ', err.message);
    }
    
    // 3. Delete user skills
    try {
      await db.sequelize.query(
        'DELETE FROM UserSkill WHERE user_id = ?',
        { replacements: [user.id] }
      );
      console.log('✅ Deleted user skills');
    } catch (err) {
      console.log('⚠️ UserSkill: ', err.message);
    }
    
    // 4. Update shifts (set user_id to NULL)
    try {
      await db.sequelize.query(
        'UPDATE Shift SET user_id = NULL WHERE user_id = ?',
        { replacements: [user.id] }
      );
      console.log('✅ Unassigned shifts');
    } catch (err) {
      console.log('⚠️ Shift: ', err.message);
    }
    
    // 5. Delete time off requests
    try {
      await db.sequelize.query(
        'DELETE FROM Time_Off_Request WHERE user_id = ?',
        { replacements: [user.id] }
      );
      console.log('✅ Deleted time off requests');
    } catch (err) {
      console.log('⚠️ Time_Off_Request: ', err.message);
    }
    
    // 6. Delete shift swap requests
    try {
      await db.sequelize.query(
        'DELETE FROM Shift_Swap_Request WHERE requester_id = ? OR target_user_id = ?',
        { replacements: [user.id, user.id] }
      );
      console.log('✅ Deleted shift swap requests');
    } catch (err) {
      console.log('⚠️ Shift_Swap_Request: ', err.message);
    }
    
    // 7. Delete notifications
    try {
      await db.sequelize.query(
        'DELETE FROM Notifications WHERE user_id = ?',
        { replacements: [user.id] }
      );
      console.log('✅ Deleted notifications');
    } catch (err) {
      console.log('⚠️ Notifications: ', err.message);
    }
    
    // 8. Update task list items (set assigned_to to NULL)
    try {
      await db.sequelize.query(
        'UPDATE TaskListItem SET assigned_to = NULL WHERE assigned_to = ?',
        { replacements: [user.id] }
      );
      console.log('✅ Unassigned task list items');
    } catch (err) {
      console.log('⚠️ TaskListItem: ', err.message);
    }
    
    // 9. Update task lists
    try {
      await db.sequelize.query(
        'UPDATE TaskList SET created_by = NULL WHERE created_by = ?',
        { replacements: [user.id] }
      );
      await db.sequelize.query(
        'UPDATE TaskList SET assigned_to = NULL WHERE assigned_to = ?',
        { replacements: [user.id] }
      );
      console.log('✅ Updated task lists');
    } catch (err) {
      console.log('⚠️ TaskList: ', err.message);
    }
    
    // 10. Update schedules
    try {
      await db.sequelize.query(
        'UPDATE Schedule SET created_by = NULL WHERE created_by = ?',
        { replacements: [user.id] }
      );
      console.log('✅ Updated schedules');
    } catch (err) {
      console.log('⚠️ Schedule: ', err.message);
    }
    
    // Finally, delete the user
    const deleted = await User.destroy({ where: { id: userId } });
    
    if (deleted) {
      console.log('✅ User deleted successfully');
      return res.send({ message: "User deleted successfully." });
    }
    
    return res.status(404).send({ message: `User not found.` });
    
  } catch (err) {
    console.error('❌ Error deleting user:', err);
    res.status(500).send({ 
      message: err.message || "Error deleting user.",
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};