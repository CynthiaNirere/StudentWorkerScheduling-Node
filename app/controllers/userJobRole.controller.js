import db from "../models/index.js";

const UserJobRole = db.userJobRole;
const User = db.user;
const JobRole = db.jobRole;
const { Op } = db.Sequelize;

// ✅ Add job role to user
export const addRoleToUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { jobRoleId, isPrimary } = req.body;
    
    if (!jobRoleId) {
      return res.status(400).send({ message: "Job Role ID is required!" });
    }
    
    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).send({ message: "User not found!" });
    }
    
    // Check if role exists
    const role = await JobRole.findByPk(jobRoleId);
    if (!role) {
      return res.status(404).send({ message: "Job role not found!" });
    }
    
    // Check if user already has this role
    const existing = await UserJobRole.findOne({
      where: { userId, jobRoleId }
    });
    
    if (existing) {
      return res.status(400).send({ message: "User already has this role!" });
    }
    
    // If isPrimary is true, clear primary only for roles at the SAME location
    if (isPrimary && role.location_id) {
      const rolesAtLocation = await UserJobRole.findAll({
        where: { userId },
        include: [{
          model: JobRole,
          as: 'jobRole',
          where: { location_id: role.location_id },
          required: true,
        }],
      });
      const idsAtLocation = rolesAtLocation.map(r => r.user_job_role_id);
      if (idsAtLocation.length > 0) {
        await UserJobRole.update(
          { isPrimary: false },
          { where: { user_job_role_id: idsAtLocation } }
        );
      }
    } else if (isPrimary) {
      await UserJobRole.update({ isPrimary: false }, { where: { userId } });
    }
    
    const userJobRole = await UserJobRole.create({
      userId,
      jobRoleId,
      isPrimary: isPrimary || false,
      createdAt: Date.now()
    });
    
    res.status(201).send({
      message: "Role added to user successfully!",
      userJobRole
    });
    
  } catch (err) {
    console.error("❌ Error adding role to user:", err);
    res.status(500).send({ message: "Error adding role to user." });
  }
};

// ✅ Get all roles for a user (optionally scoped to a workplace via ?locationId=)
export const getUserRoles = async (req, res) => {
  try {
    const userId    = req.params.userId;
    const locationId = req.query.locationId ? Number(req.query.locationId) : null;

    const userRoles = await UserJobRole.findAll({
      where: { userId },
      include: [{
        model: JobRole,
        as: 'jobRole',
        attributes: ['job_role_id', 'title', 'description'],
        where: locationId ? { location_id: locationId } : undefined,
        required: !!locationId,
      }],
      order: [['isPrimary', 'DESC']]
    });
    
    const formattedRoles = userRoles.map(ur => ({
      user_job_role_id: ur.user_job_role_id,
      user_id: ur.userId,
      job_role_id: ur.jobRoleId,
      is_primary: ur.isPrimary,
      role_title: ur.jobRole ? ur.jobRole.title : null,
      role_description: ur.jobRole ? ur.jobRole.description : null,
      created_at: ur.createdAt
    }));
    
    res.send(formattedRoles);
    
  } catch (err) {
    console.error("❌ Error retrieving user roles:", err);
    res.status(500).send({ message: "Error retrieving user roles." });
  }
};

// ✅ Remove role from user
export const removeRoleFromUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const jobRoleId = req.params.roleId;
    
    const deleted = await UserJobRole.destroy({
      where: { userId, jobRoleId }
    });
    
    if (deleted) {
      res.send({ message: "Role removed from user successfully!" });
    } else {
      res.status(404).send({ message: "User role not found!" });
    }
    
  } catch (err) {
    console.error("❌ Error removing role from user:", err);
    res.status(500).send({ message: "Error removing role from user." });
  }
};

// ✅ Set primary role (scoped to the employer's workplace so other workplaces are unaffected)
export const setPrimaryRole = async (req, res) => {
  try {
    const userId    = req.params.userId;
    const jobRoleId = req.params.roleId;
    const locationId = req.workLocation || null;

    if (locationId) {
      // Find only the UserJobRole records that belong to this location
      const rolesAtLocation = await UserJobRole.findAll({
        where: { userId },
        include: [{
          model: JobRole,
          as: 'jobRole',
          where: { location_id: locationId },
          required: true,
        }],
      });
      const idsAtLocation = rolesAtLocation.map(r => r.user_job_role_id);
      if (idsAtLocation.length > 0) {
        await UserJobRole.update(
          { isPrimary: false },
          { where: { user_job_role_id: idsAtLocation } }
        );
      }
    } else {
      // Fallback: no location context, clear all
      await UserJobRole.update({ isPrimary: false }, { where: { userId } });
    }

    // Set specified role as primary
    const [updated] = await UserJobRole.update(
      { isPrimary: true },
      { where: { userId, jobRoleId } }
    );

    if (updated === 1) {
      res.send({ message: "Primary role updated successfully!" });
    } else {
      res.status(404).send({ message: "User role not found!" });
    }

  } catch (err) {
    console.error("❌ Error setting primary role:", err);
    res.status(500).send({ message: "Error setting primary role." });
  }
};

// ✅ Get all users with a specific role
export const getUsersByRole = async (req, res) => {
  try {
    const jobRoleId = req.params.roleId;
    
    const userRoles = await UserJobRole.findAll({
      where: { jobRoleId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'fName', 'lName', 'email', 'phone_number']
      }]
    });
    
    const users = userRoles.map(ur => ({
      user_id: ur.user.id,
      first_name: ur.user.fName,
      last_name: ur.user.lName,
      email: ur.user.email,
      phone_number: ur.user.phone_number,
      is_primary: ur.isPrimary
    }));
    
    res.send(users);
    
  } catch (err) {
    console.error("❌ Error retrieving users by role:", err);
    res.status(500).send({ message: "Error retrieving users by role." });
  }
}