import db from "../models/index.js";

const User = db.user;
const { Op } = db.Sequelize;

// Create and Save a new User
export const create = async (req, res) => {
  try {
    // Accept both naming conventions
    const firstName = req.body.firstName || req.body.first_name || req.body.fName;
    const lastName = req.body.lastName || req.body.last_name || req.body.lName;
    const email = req.body.email;
    const phoneNumber = req.body.phoneNumber || req.body.phone_number;
    const role = req.body.role || 'employee';
    const workLocation = req.body.workLocation || req.body.work_location || req.workLocation;
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
    
    // ✅ NEW: If creating an employee, inherit work_location from the employer
    let finalWorkLocation = workLocation;
    if (role === 'employee' && !workLocation && req.user) {
      // Get the requesting user (employer)
      const requestingUser = await User.findOne({ where: { id: req.user.userId || req.user.id } });
      if (requestingUser && requestingUser.work_location) {
        finalWorkLocation = requestingUser.work_location;
        console.log(`✅ Employee inheriting work_location ${finalWorkLocation} from employer`);
      }
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
      work_location: finalWorkLocation || null,
      age: age || null,
      bio: bio || null,
      createdAt: Date.now(),
      updatedAt: null
    });
    
    console.log("✅ User created with ID:", user.id, "at work_location:", user.work_location);
    
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
    console.error("Error creating user:", err.message);
    res.status(500).send({
      message: err.message || "Error creating user.",
    });
  }
};

// ✅ UPDATED: Retrieve all Users with workplace isolation
export const findAll = async (req, res) => {
  try {
    // Get the requesting user's info
    const requestingUserId = req.user?.userId || req.user?.id;
    
    if (!requestingUserId) {
      return res.status(401).send({ message: "Unauthorized" });
    }
    
    const requestingUser = await User.findOne({ 
      where: { id: requestingUserId },
      attributes: { exclude: ['password_hash'] }
    });
    
    if (!requestingUser) {
      return res.status(404).send({ message: "User not found" });
    }
    
    console.log(`📋 User ${requestingUser.email} (${requestingUser.role}) requesting users list from work_location ${requestingUser.work_location}`);
    
    let condition = {};
    
    // Role-based filtering with workplace isolation
    if (requestingUser.role === 'admin') {
      // ✅ Admins see ALL users
      console.log('👑 Admin access - showing all users');
      const roleFilter = req.query.role;
      if (roleFilter) {
        condition.role = { [Op.like]: `%${roleFilter}%` };
      }
    } else if (requestingUser.role === 'employer') {
      // ✅ Employers see only employees from their work_location
      console.log(`🏢 Employer access - filtering by work_location ${requestingUser.work_location}`);
      condition = {
        role: 'employee',
        work_location: requestingUser.work_location
      };
    } else if (requestingUser.role === 'employee') {
      // ✅ Employees see only themselves
      console.log('👤 Employee access - showing only self');
      condition.id = requestingUser.id;
    } else {
      return res.status(403).send({ message: "Access denied" });
    }
    
    const users = await User.findAll({ 
      where: condition,
      attributes: { exclude: ['password_hash'] }
    });
    
    console.log(`✅ Returning ${users.length} users`);
    
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
    console.error("Error retrieving users:", err);
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
    console.error("Error retrieving user:", err);
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
    console.error("Error retrieving user by email:", err);
    res.status(500).send({ message: "Error retrieving user." });
  }
};

// Update a User
export const update = async (req, res) => {
  try {
    const userId = req.params.id;
    
    const updateData = {};
    
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
    console.error("Error updating user:", err);
    res.status(500).send({ message: "Error updating user." });
  }
};

// ✅ FIXED: Delete a User with proper cleanup including created_by
export const remove = async (req, res) => {
  try {
    const userId = req.params.id;
    
    console.log(`🗑️ Attempting to delete user: ${userId}`);
    
    // Find the user first
    const user = await User.findOne({ where: { id: userId } });
    
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    
    console.log(`🗑️ Found user: ${user.fName} ${user.lName}, role: ${user.role}`);
    
    // Start a transaction
    const transaction = await db.sequelize.transaction();
    
    try {
      // ✅ Helper function to safely delete from table
      const safeDelete = async (tableName, whereClause, description) => {
        try {
          const result = await db.sequelize.query(
            `DELETE FROM ${tableName} WHERE ${whereClause}`,
            { replacements: [userId, userId], transaction }
          );
          console.log(`✅ ${description}: Deleted ${result[0].affectedRows || 0} rows`);
        } catch (err) {
          console.log(`⚠️ ${description}: ${err.message}`);
        }
      };
      
      // ✅ Helper function to safely update table
      const safeUpdate = async (tableName, setClause, whereClause, description) => {
        try {
          const result = await db.sequelize.query(
            `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`,
            { replacements: [userId, userId], transaction }
          );
          console.log(`✅ ${description}: Updated ${result[0].affectedRows || 0} rows`);
        } catch (err) {
          console.log(`⚠️ ${description}: ${err.message}`);
        }
      };
      
      // ✅ If deleting an employer, unassign their employees
      if (user.role === 'employer' && user.work_location) {
        try {
          const result = await db.sequelize.query(
            'UPDATE User SET work_location = NULL WHERE work_location = ? AND role = "employee"',
            { replacements: [user.work_location], transaction }
          );
          console.log(`✅ Unassigned employees from workplace ${user.work_location}`);
        } catch (err) {
          console.log(`⚠️ Error unassigning employees: ${err.message}`);
        }
      }
      
      // Delete/Update related records
      await safeDelete('Session', 'user_id = ?', 'Sessions');
      await safeDelete('Availability', 'user_id = ?', 'Availability');
      
      // Try both singular and plural for UserSkill/UserSkills
      await safeDelete('UserSkill', 'user_id = ?', 'UserSkill');
      await safeDelete('UserSkills', 'user_id = ?', 'UserSkills');
      
      // ✅ CRITICAL FIX: Update BOTH user_id AND created_by in Shift table
      await safeUpdate('Shift', 'user_id = NULL', 'user_id = ?', 'Shifts (user_id)');
      await safeUpdate('Shift', 'created_by = NULL', 'created_by = ?', 'Shifts (created_by)');
      
      await safeDelete('Time_Off_Request', 'user_id = ?', 'Time Off Requests');
      
      // Try different column name variations for Shift_Swap_Request
      await safeDelete('Shift_Swap_Request', 'requester_id = ? OR target_user_id = ?', 'Shift Swap Requests');
      await safeDelete('Shift_Swap_Request', 'requesting_user_id = ? OR target_user_id = ?', 'Shift Swap Requests (alt)');
      
      await safeDelete('Notifications', 'user_id = ?', 'Notifications');
      await safeDelete('Notification', 'user_id = ?', 'Notification (singular)');
      
      await safeUpdate('TaskListItem', 'assigned_to = NULL', 'assigned_to = ?', 'Task List Items');
      await safeUpdate('TaskList', 'created_by = NULL', 'created_by = ?', 'Task Lists (created_by)');
      await safeUpdate('TaskList', 'assigned_to = NULL', 'assigned_to = ?', 'Task Lists (assigned_to)');
      await safeUpdate('Schedule', 'created_by = NULL', 'created_by = ?', 'Schedules');
      await safeDelete('CalendarEvent', 'user_id = ?', 'Calendar Events');
      
      // Finally, delete the user
      await User.destroy({ 
        where: { id: userId },
        transaction
      });
      
      // Commit the transaction
      await transaction.commit();
      
      console.log(`✅ Successfully deleted user: ${userId}`);
      
      res.status(200).json({
        message: "User deleted successfully",
        userId: userId
      });
      
    } catch (err) {
      // Rollback transaction on error
      await transaction.rollback();
      console.error("❌ Error in delete transaction:", err);
      throw err;
    }
    
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).send({ 
      message: "Error deleting user",
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};