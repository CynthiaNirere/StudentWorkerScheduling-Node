import db from "../models/index.js";

const User    = db.user;
const { Op }  = db.Sequelize;

// ── CREATE ────────────────────────────────────────────────────────────────
export const create = async (req, res) => {
  try {
    const firstName   = req.body.firstName  || req.body.first_name || req.body.fName;
    const lastName    = req.body.lastName   || req.body.last_name  || req.body.lName;
    const email       = req.body.email;
    const phoneNumber = req.body.phoneNumber || req.body.phone_number;
    const role        = req.body.role || 'employee';
    const workLocation = req.body.workLocation || req.body.work_location || req.workLocation;
    const password    = req.body.password || req.body.password_hash;
    const age         = req.body.age;
    const bio         = req.body.bio;

    if (!firstName || !email) {
      return res.status(400).send({ message: "First name and email are required!" });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).send({ message: "Email already exists" });
    }

    // If creating an employee, inherit work_location from the requesting employer
    let finalWorkLocation = workLocation;
    if (role === 'employee' && !workLocation && req.user) {
      const requestingUser = await User.findOne({ where: { id: req.user.userId || req.user.id } });
      if (requestingUser?.work_location) {
        finalWorkLocation = requestingUser.work_location;
        console.log(`Employee inheriting work_location ${finalWorkLocation} from employer`);
      }
    }

    const rolePrefix = role === 'admin' ? 'admin' : role === 'employer' ? 'mgr' : 'emp';
    const user_id    = `${rolePrefix}-${Date.now().toString().slice(-8)}-${Math.random().toString(36).substr(2, 4)}`;

    const user = await User.create({
      id:            user_id,
      email,
      password_hash: password || 'TempPass123!',
      fName:         firstName,
      lName:         lastName || '',
      phone_number:  phoneNumber || null,
      role,
      work_location: finalWorkLocation || null,
      age:           age  || null,
      bio:           bio  || null,
      createdAt:     Date.now(),
      updatedAt:     null,
    });

    console.log("User created:", user.id, "at work_location:", user.work_location);

    res.status(201).send({
      user_id:       user.id,
      userId:        user.id,
      first_name:    user.fName,
      last_name:     user.lName,
      fName:         user.fName,
      lName:         user.lName,
      email:         user.email,
      phone_number:  user.phone_number,
      role:          user.role,
      work_location: user.work_location,
      age:           user.age,
      bio:           user.bio,
      created_at:    user.createdAt,
    });

  } catch (err) {
    console.error("Error creating user:", err.message);
    res.status(500).send({ message: err.message || "Error creating user." });
  }
};

// ── FIND ALL (scoped by role / workplace) ─────────────────────────────────
export const findAll = async (req, res) => {
  try {
    const requestingUserId = req.user?.userId || req.user?.id;
    if (!requestingUserId) return res.status(401).send({ message: "Unauthorized" });

    const requestingUser = await User.findOne({
      where: { id: requestingUserId },
      attributes: { exclude: ['password_hash'] },
    });
    if (!requestingUser) return res.status(404).send({ message: "User not found" });

    console.log(`User ${requestingUser.email} (${requestingUser.role}) listing users, location ${requestingUser.work_location}`);

    let condition = {};

    if (requestingUser.role === 'admin') {
      // Admins see everyone; optional role filter from query string
      const roleFilter = req.query.role;
      if (roleFilter) condition.role = { [Op.like]: `%${roleFilter}%` };

    } else if (requestingUser.role === 'employer') {
      // Employers see only employees at their workplace
      condition = { role: 'employee', work_location: requestingUser.work_location };

    } else if (requestingUser.role === 'employee') {
      // Employees see only themselves
      condition.id = requestingUser.id;

    } else {
      return res.status(403).send({ message: "Access denied" });
    }

    const users = await User.findAll({
      where: condition,
      attributes: { exclude: ['password_hash'] },
    });

    console.log(`Returning ${users.length} users`);

    res.send(users.map(u => ({
      user_id:       u.id,
      userId:        u.id,
      first_name:    u.fName,
      last_name:     u.lName,
      fName:         u.fName,
      lName:         u.lName,
      email:         u.email,
      phone_number:  u.phone_number,
      role:          u.role,
      work_location: u.work_location,
      age:           u.age,
      bio:           u.bio,
      created_at:    u.createdAt,
      updated_at:    u.updatedAt,
    })));

  } catch (err) {
    console.error("❌ Error retrieving users:", err);
    res.status(500).send({ message: "Error retrieving users." });
  }
};

// ── FIND ONE ──────────────────────────────────────────────────────────────
export const findOne = async (req, res) => {
  try {
    const user = await User.findOne({
      where: { id: req.params.id },
      attributes: { exclude: ['password_hash'] },
    });
    if (!user) return res.status(404).send({ message: `User not found with id=${req.params.id}` });

    res.send({
      user_id:       user.id,
      userId:        user.id,
      first_name:    user.fName,
      last_name:     user.lName,
      fName:         user.fName,
      lName:         user.lName,
      email:         user.email,
      phone_number:  user.phone_number,
      role:          user.role,
      work_location: user.work_location,
      age:           user.age,
      bio:           user.bio,
      created_at:    user.createdAt,
      updated_at:    user.updatedAt,
    });
  } catch (err) {
    console.error("❌ Error retrieving user:", err);
    res.status(500).send({ message: "Error retrieving user." });
  }
};

// ── FIND BY EMAIL ─────────────────────────────────────────────────────────
export const findByEmail = async (req, res) => {
  try {
    const user = await User.findOne({
      where: { email: req.params.email },
      attributes: { exclude: ['password_hash'] },
    });
    if (!user) return res.status(404).send({ message: `User not found with email=${req.params.email}` });

    res.send({
      user_id:       user.id,
      userId:        user.id,
      first_name:    user.fName,
      last_name:     user.lName,
      fName:         user.fName,
      lName:         user.lName,
      email:         user.email,
      phone_number:  user.phone_number,
      role:          user.role,
      work_location: user.work_location,
      age:           user.age,
      bio:           user.bio,
      created_at:    user.createdAt,
      updated_at:    user.updatedAt,
    });
  } catch (err) {
    console.error("❌ Error retrieving user by email:", err);
    res.status(500).send({ message: "Error retrieving user." });
  }
};

// ── UPDATE ────────────────────────────────────────────────────────────────
export const update = async (req, res) => {
  try {
    const userId     = req.params.id;
    const updateData = {};

    if (req.body.firstName  || req.body.first_name || req.body.fName)
      updateData.fName = req.body.firstName || req.body.first_name || req.body.fName;
    if (req.body.lastName   || req.body.last_name  || req.body.lName)
      updateData.lName = req.body.lastName  || req.body.last_name  || req.body.lName;
    if (req.body.email)
      updateData.email = req.body.email;
    if (req.body.phoneNumber || req.body.phone_number)
      updateData.phone_number = req.body.phoneNumber || req.body.phone_number;
    if (req.body.role)
      updateData.role = req.body.role;
    if (req.body.workLocation !== undefined || req.body.work_location !== undefined)
      updateData.work_location = req.body.workLocation ?? req.body.work_location;
    if (req.body.age  !== undefined) updateData.age  = req.body.age;
    if (req.body.bio  !== undefined) updateData.bio  = req.body.bio;

    updateData.updatedAt = Date.now();

    const [updated] = await User.update(updateData, { where: { id: userId } });

    if (updated !== 1) {
      return res.status(404).send({ message: "User not found or no data changed." });
    }

    const user = await User.findOne({ where: { id: userId }, attributes: { exclude: ['password_hash'] } });

    res.send({
      message: "User updated successfully.",
      user: {
        user_id:       user.id,
        userId:        user.id,
        first_name:    user.fName,
        last_name:     user.lName,
        fName:         user.fName,
        lName:         user.lName,
        email:         user.email,
        phone_number:  user.phone_number,
        role:          user.role,
        work_location: user.work_location,
        age:           user.age,
        bio:           user.bio,
      },
    });
  } catch (err) {
    console.error("❌ Error updating user:", err);
    res.status(500).send({ message: "Error updating user." });
  }
};

// ── REMOVE ────────────────────────────────────────────────────────────────
export const remove = async (req, res) => {
  const userId = req.params.id;
  console.log(`Attempting to delete user: ${userId}`);

  const user = await User.findOne({ where: { id: userId } });
  if (!user) return res.status(404).send({ message: "User not found" });

  const transaction = await db.sequelize.transaction();

  try {
    const q = (sql, replacements) =>
      db.sequelize.query(sql, { replacements, transaction }).catch(e => console.warn(e.message));

    // If deleting an employer, unassign their employees first
    if (user.role === 'employer' && user.work_location) {
      await q('UPDATE User SET work_location = NULL WHERE work_location = ? AND role = "employee"',
        [user.work_location]);
    }

    await q('DELETE FROM Session WHERE user_id = ?',                              [userId]);
    await q('DELETE FROM Availability WHERE user_id = ?',                         [userId]);
    await q('DELETE FROM UserSkill WHERE user_id = ?',                            [userId]);
    await q('UPDATE Shift SET user_id = NULL WHERE user_id = ?',                  [userId]);
    await q('UPDATE Shift SET created_by = NULL WHERE created_by = ?',            [userId]);
    await q('DELETE FROM Time_Off_Request WHERE user_id = ?',                     [userId]);
    await q('DELETE FROM Shift_Swap_Request_User WHERE user_id = ?',              [userId]);
    await q('DELETE FROM Notifications WHERE user_id = ?',                        [userId]);
    await q('UPDATE TaskListItem SET assigned_to = NULL WHERE assigned_to = ?',   [userId]);
    await q('UPDATE TaskListItem SET completed_by = NULL WHERE completed_by = ?', [userId]);
    await q('UPDATE TaskList SET created_by = NULL WHERE created_by = ?',         [userId]);
    await q('UPDATE TaskList SET assigned_to = NULL WHERE assigned_to = ?',       [userId]);
    await q('UPDATE Schedule SET created_by = NULL WHERE created_by = ?',         [userId]);
    await q('DELETE FROM Message WHERE sender_id = ? OR recipient_id = ?',        [userId, userId]);

    await User.destroy({ where: { id: userId }, transaction });
    await transaction.commit();

    console.log(`Successfully deleted user: ${userId}`);
    res.send({ message: "User deleted successfully.", userId });

  } catch (err) {
    await transaction.rollback();
    console.error("Error deleting user:", err);
    res.status(500).send({ message: "Error deleting user.", error: err.message });
  }
};