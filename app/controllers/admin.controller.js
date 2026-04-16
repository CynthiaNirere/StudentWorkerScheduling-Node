import db from "../models/index.js";
import { sendManagerWelcomeEmail, sendEmployeeWelcomeEmail } from "../services/emailService.js";

const User = db.user;
const BusinessArea = db.businessArea;
const JobRole = db.jobRole;
const { Op } = db.Sequelize;

// ========================================
// USER MANAGEMENT
// ========================================

// Create and Save a new User
export const createUser = async (req, res) => {
  try {
    console.log("Creating user with data:", req.body);
    
    // Handle both camelCase and snake_case from frontend
    const firstName = req.body.firstName || req.body.first_name;
    const lastName = req.body.lastName || req.body.last_name;
    const email = req.body.email;
    const phoneNumber = req.body.phoneNumber || req.body.phone_number;
    const role = req.body.role;
    const workLocation = req.body.workLocation || req.body.work_location;
    
    // Validate required fields
    if (!firstName || !email || !role) {
      return res.status(400).send({ 
        message: "First name, email, and role are required!" 
      });
    }
    
    // Check if email already exists
    const existingUser = await User.findOne({ where: { email: email } });
    if (existingUser) {
      return res.status(400).send({ message: "Email already exists" });
    }
    
    // Generate a temporary password (plain text for now)
    const tempPassword = "TempPass123!"; 
    
    // Generate user_id based on role and timestamp
    const rolePrefix = role === 'admin' ? 'admin' : role === 'employer' ? 'mgr' : 'emp';
    const timestamp = Date.now().toString().slice(-8);
    const randomStr = Math.random().toString(36).substr(2, 4);
    const user_id = `${rolePrefix}-${timestamp}-${randomStr}`;
    
    console.log("Generated user_id:", user_id);
    
    // Create user - USE 'id' because that's what the Sequelize model expects
    const user = await User.create({
      id: user_id,
      email: email,
      password_hash: tempPassword,
      fName: firstName,
      lName: lastName || '',
      phone_number: phoneNumber || null,
      role: role,
      work_location: workLocation || null,
      createdAt: Date.now(),
      updatedAt: null
    });
    
    console.log("User created with ID:", user.id);

    // ✅ NEW: Send welcome email based on role
    try {
      // Get workplace name for email
      let workplaceName = 'your workplace';
      if (workLocation && BusinessArea) {
        const workplace = await BusinessArea.findOne({ where: { location_id: workLocation } });
        if (workplace) {
          workplaceName = workplace.name;
        }
      }

      // Get who added this user
      let addedByName = 'your administrator';
      if (req.user) {
        const addingUser = await User.findOne({ where: { id: req.user.userId || req.user.id } });
        if (addingUser) {
          addedByName = `${addingUser.fName} ${addingUser.lName}`;
        }
      }

      const userData = {
        email: user.email,
        first_name: user.fName,
        last_name: user.lName,
        fName: user.fName,
        lName: user.lName,
      };

      // Send appropriate email based on role
      if (role === 'employer') {
        console.log('📧 Sending manager welcome email to:', user.email);
        const emailResult = await sendManagerWelcomeEmail(userData, workplaceName, addedByName);
        if (emailResult.success) {
          console.log('✅ Manager welcome email sent successfully');
        } else {
          console.error('❌ Failed to send manager welcome email:', emailResult.error);
        }
      } else if (role === 'employee') {
        console.log('📧 Sending employee welcome email to:', user.email);
        const emailResult = await sendEmployeeWelcomeEmail(userData, workplaceName, addedByName);
        if (emailResult.success) {
          console.log('✅ Employee welcome email sent successfully');
        } else {
          console.error('❌ Failed to send employee welcome email:', emailResult.error);
        }
      }
    } catch (emailError) {
      // Don't fail user creation if email fails
      console.error('❌ Error sending welcome email:', emailError);
    }
    
    // Return formatted user data
    const responseData = {
      user_id: user.id,
      first_name: user.fName,
      last_name: user.lName,
      email: user.email,
      phone_number: user.phone_number,
      role: user.role,
      work_location: user.work_location,
      created_at: user.createdAt,
      tempPassword: tempPassword
    };
    
    console.log("✅ User created successfully");
    res.status(201).send({
      message: "User created successfully! Temporary password: " + tempPassword,
      user: responseData
    });
    
  } catch (err) {
    console.error("Error creating user:", err.message);
    console.error("Stack:", err.stack);
    res.status(500).send({
      message: err.message || "Error creating user.",
      error: err.message
    });
  }
};

// Retrieve all Users
export const getAllUsers = async (req, res) => {
  try {
    const role = req.query.role;
    const condition = role ? { role: { [Op.like]: `%${role}%` } } : undefined;
    const users = await User.findAll({ 
      where: condition,
      attributes: { exclude: ['password_hash'] }
    });
    
    // Format the response to match frontend expectations
    const formattedUsers = users.map(user => ({
      user_id: user.id,
      first_name: user.fName,
      last_name: user.lName,
      email: user.email,
      phone_number: user.phone_number,
      role: user.role,
      work_location: user.work_location,
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
export const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findOne({ 
      where: { id: userId },
      attributes: { exclude: ['password_hash'] }
    });
    
    if (!user) {
      return res.status(404).send({ message: `User not found with id=${userId}` });
    }
    
    // Format response
    const formattedUser = {
      user_id: user.id,
      first_name: user.fName,
      last_name: user.lName,
      email: user.email,
      phone_number: user.phone_number,
      role: user.role,
      work_location: user.work_location,
      created_at: user.createdAt,
      updated_at: user.updatedAt
    };
    
    res.send(formattedUser);
  } catch (err) {
    console.error("❌ Error retrieving user:", err);
    res.status(500).send({ message: "Error retrieving user." });
  }
};

// Update a User
export const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Handle both camelCase and snake_case
    const updateData = {};
    
    if (req.body.firstName || req.body.first_name) {
      updateData.fName = req.body.firstName || req.body.first_name;
    }
    if (req.body.lastName || req.body.last_name) {
      updateData.lName = req.body.lastName || req.body.last_name;
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
    
    // Add updated_at timestamp
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
          first_name: user.fName,
          last_name: user.lName,
          email: user.email,
          phone_number: user.phone_number,
          role: user.role,
          work_location: user.work_location
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

// ✅ FIXED: Delete user with proper cascade handling
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    console.log(`🗑️ [ADMIN] Deleting user ${userId} and all related records...`);
    
    // Check if user exists first
    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).send({ message: `User not found.` });
    }
    
    // 1. Sessions
    try {
      await db.sequelize.query('DELETE FROM Session WHERE user_id = ?', { replacements: [userId] });
      console.log('✅ Deleted sessions');
    } catch (err) {
      console.log('⚠️ Sessions:', err.message);
    }
    
    // 2. Availability
    try {
      await db.sequelize.query('DELETE FROM Availability WHERE user_id = ?', { replacements: [userId] });
      console.log('✅ Deleted availability');
    } catch (err) {
      console.log('⚠️ Availability:', err.message);
    }
    
    // 3. User skills
    try {
      await db.sequelize.query('DELETE FROM UserSkill WHERE user_id = ?', { replacements: [userId] });
      console.log('✅ Deleted user skills');
    } catch (err) {
      console.log('⚠️ UserSkill:', err.message);
    }
    
    // 4. ✅ CRITICAL FIX: Update BOTH user_id AND created_by in Shift table
    try {
      await db.sequelize.query('UPDATE Shift SET user_id = NULL WHERE user_id = ?', { replacements: [userId] });
      await db.sequelize.query('UPDATE Shift SET created_by = NULL WHERE created_by = ?', { replacements: [userId] });
      console.log('✅ Unassigned shifts (both user_id and created_by)');
    } catch (err) {
      console.error('❌ CRITICAL - Failed to unassign shifts:', err.message);
      return res.status(500).send({ 
        message: 'Cannot delete user: Failed to unassign shifts. ' + err.message 
      });
    }
    
    // 5. Time off requests
    try {
      await db.sequelize.query('DELETE FROM Time_Off_Request WHERE user_id = ?', { replacements: [userId] });
      console.log('✅ Deleted time off requests');
    } catch (err) {
      console.log('⚠️ Time_Off_Request:', err.message);
    }
    
    // 6. Shift swap requests - try different column names
    try {
      await db.sequelize.query('DELETE FROM Shift_Swap_Request WHERE requester_id = ? OR target_user_id = ?', { replacements: [userId, userId] });
      console.log('✅ Deleted shift swap requests');
    } catch (err) {
      // Try alternative column names
      try {
        await db.sequelize.query('DELETE FROM Shift_Swap_Request WHERE requesting_user_id = ? OR target_user_id = ?', { replacements: [userId, userId] });
        console.log('✅ Deleted shift swap requests (alt columns)');
      } catch (err2) {
        console.log('⚠️ Shift_Swap_Request:', err.message);
      }
    }
    
    // 7. Notifications
    try {
      await db.sequelize.query('DELETE FROM Notifications WHERE user_id = ?', { replacements: [userId] });
      console.log('✅ Deleted notifications');
    } catch (err) {
      console.log('⚠️ Notifications:', err.message);
    }
    
    // 8. Task list items
    try {
      await db.sequelize.query('UPDATE TaskListItem SET assigned_to = NULL WHERE assigned_to = ?', { replacements: [userId] });
      console.log('✅ Unassigned task list items');
    } catch (err) {
      console.log('⚠️ TaskListItem:', err.message);
    }
    
    // 9. Task lists
    try {
      await db.sequelize.query('UPDATE TaskList SET created_by = NULL WHERE created_by = ?', { replacements: [userId] });
      await db.sequelize.query('UPDATE TaskList SET assigned_to = NULL WHERE assigned_to = ?', { replacements: [userId] });
      console.log('✅ Updated task lists');
    } catch (err) {
      console.log('⚠️ TaskList:', err.message);
    }
    
    // 10. Schedules
    try {
      await db.sequelize.query('UPDATE Schedule SET created_by = NULL WHERE created_by = ?', { replacements: [userId] });
      console.log('✅ Updated schedules');
    } catch (err) {
      console.log('⚠️ Schedule:', err.message);
    }
    
    // 11. Calendar events
    try {
      await db.sequelize.query('DELETE FROM CalendarEvent WHERE user_id = ?', { replacements: [userId] });
      console.log('✅ Deleted calendar events');
    } catch (err) {
      console.log('⚠️ CalendarEvent:', err.message);
    }
    
    // 12. If employer, unassign employees
    if (user.role === 'employer' && user.work_location) {
      try {
        await db.sequelize.query('UPDATE User SET work_location = NULL WHERE work_location = ? AND role = "employee"', { replacements: [user.work_location] });
        console.log('✅ Unassigned employees from workplace');
      } catch (err) {
        console.log('⚠️ Unassigning employees:', err.message);
      }
    }
    
    // Finally delete the user
    const deleted = await User.destroy({ where: { id: userId } });
    
    if (deleted) {
      console.log('✅ User deleted successfully');
      return res.send({ message: "User deleted successfully." });
    }
    
    return res.status(404).send({ message: `User not found.` });
    
  } catch (err) {
    console.error('❌ [ADMIN] Error deleting user:', err);
    console.error('Error message:', err.message);
    res.status(500).send({ 
      message: err.message || "Error deleting user.",
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// ========================================
// BUSINESS AREA MANAGEMENT
// ========================================

// Create and Save a new Business Area
export const createBusinessArea = async (req, res) => {
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
export const getAllBusinessAreas = async (req, res) => {
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
export const getBusinessAreaById = async (req, res) => {
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
export const updateBusinessArea = async (req, res) => {
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
export const deleteBusinessArea = async (req, res) => {
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

// ========================================
// JOB ROLE MANAGEMENT
// ========================================

// Create and Save a new Job Role
export const createJobRole = async (req, res) => {
  try {
    console.log("📝 Creating job role with data:", req.body);
    
    if (!req.body.title || !req.body.location_id) {
      return res.status(400).send({ message: "Title and location_id are required!" });
    }
    
    const jobRole = await JobRole.create({
      title: req.body.title,
      description: req.body.description || null,
      location_id: req.body.location_id,
      created_at: Date.now()
    });
    
    console.log("✅ Job role created with ID:", jobRole.job_role_id);
    res.status(201).send(jobRole);
    
  } catch (err) {
    console.error("❌ Error creating job role:", err.message);
    console.error("Stack:", err.stack);
    res.status(500).send({
      message: err.message || "Error creating job role.",
      error: err.message
    });
  }
};

// Retrieve all Job Roles
export const getAllJobRoles = async (req, res) => {
  try {
    const location_id = req.query.location_id;
    const condition = location_id ? { location_id: location_id } : undefined;
    const jobRoles = await JobRole.findAll({ 
      where: condition,
      include: [{
        model: BusinessArea,
        as: 'businessArea'
      }]
    });
    res.send(jobRoles);
  } catch (err) {
    console.error("❌ Error retrieving job roles:", err);
    res.status(500).send({ message: "Error retrieving job roles." });
  }
};

// Find one Job Role by ID
export const getJobRoleById = async (req, res) => {
  try {
    const id = req.params.id;
    const jobRole = await JobRole.findByPk(id, {
      include: [{
        model: BusinessArea,
        as: 'businessArea'
      }]
    });
    if (!jobRole)
      return res.status(404).send({ message: `Job role not found with id=${id}` });
    res.send(jobRole);
  } catch (err) {
    console.error("❌ Error retrieving job role:", err);
    res.status(500).send({ message: "Error retrieving job role." });
  }
};

// Update a Job Role
export const updateJobRole = async (req, res) => {
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
    console.error("❌ Error updating job role:", err);
    res.status(500).send({ message: "Error updating job role." });
  }
};

// Delete a Job Role
export const deleteJobRole = async (req, res) => {
  try {
    const id = req.params.id;
    
    console.log(`🗑️ Deleting job role ${id}...`);
    
    // Check if job role exists first
    const jobRole = await JobRole.findByPk(id);
    if (!jobRole) {
      return res.status(404).send({ message: `Job role not found.` });
    }
    
    // Now delete the job role
    const deleted = await JobRole.destroy({ where: { job_role_id: id } });
    
    if (deleted) {
      console.log('✅ Job role deleted successfully');
      return res.send({ message: "Job role deleted successfully." });
    }
    
    return res.status(404).send({ message: `Job role not found.` });
    
  } catch (err) {
    console.error('❌ Error deleting job role:', err);
    console.error('Error message:', err.message);
    res.status(500).send({ 
      message: err.message || "Error deleting job role." 
    });
  }
};