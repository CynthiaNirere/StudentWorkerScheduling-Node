import db from "../models/index.js";

const User         = db.user;
const UserWorkplace = db.userWorkplace;
const BusinessArea  = db.businessArea;
const { Op }       = db.Sequelize;

// ── CREATE ────────────────────────────────────────────────────────────────
export const create = async (req, res) => {
  try {
    const firstName    = req.body.firstName  || req.body.first_name || req.body.fName;
    const lastName     = req.body.lastName   || req.body.last_name  || req.body.lName;
    const email        = req.body.email;
    const phoneNumber  = req.body.phoneNumber || req.body.phone_number;
    const role         = req.body.role || 'employee';
    const workLocation = req.body.workLocation || req.body.work_location || req.workLocation;
    const password     = req.body.password || req.body.password_hash;
    const age          = req.body.age;
    const bio          = req.body.bio;

    if (!firstName || !email) {
      return res.status(400).send({ message: "First name and email are required!" });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).send({ message: "Email already exists" });
    }

    // Inherit work_location from the requesting employer if not provided
    let finalWorkLocation = workLocation;
    if (role === 'employee' && !workLocation && req.user) {
      const requestingUser = await User.findOne({ where: { id: req.user.userId || req.user.id } });
      if (requestingUser?.work_location) {
        finalWorkLocation = requestingUser.work_location;
        console.log(`Employee inheriting work_location ${finalWorkLocation} from employer`);
      }
    }

    const rolePrefix = role === 'employer' ? 'mgr' : 'emp';
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
      age:           age || null,
      bio:           bio || null,
      createdAt:     Date.now(),
      updatedAt:     null,
    });

    // Also add a UserWorkplace record so multi-location logic works
    if (finalWorkLocation) {
      try {
        await UserWorkplace.findOrCreate({
          where: { userId: user.id, locationId: finalWorkLocation },
          defaults: { userId: user.id, locationId: finalWorkLocation, createdAt: Date.now() },
        });
      } catch (e) {
        console.warn("UserWorkplace create skipped:", e.message);
      }
    }

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

// ── SEARCH USERS BY NAME (for "add existing employee" flow) ───────────────
// Returns users whose name matches the query and are NOT already at this location
export const searchByName = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).send({ message: "Query must be at least 2 characters" });
    }

    const requestingUserId = req.user?.userId || req.user?.id;
    const requestingUser   = await User.findOne({ where: { id: requestingUserId } });
    if (!requestingUser) return res.status(401).send({ message: "Unauthorized" });

    const currentLocation = requestingUser.work_location;

    // Find users whose first or last name contains the query
    const parts = q.trim().split(/\s+/);
    let whereClause;
    if (parts.length === 1) {
      whereClause = {
        role: 'employee',
        [Op.or]: [
          { fName: { [Op.like]: `%${parts[0]}%` } },
          { lName: { [Op.like]: `%${parts[0]}%` } },
        ],
      };
    } else {
      // Two words — try first+last
      whereClause = {
        role: 'employee',
        fName: { [Op.like]: `%${parts[0]}%` },
        lName: { [Op.like]: `%${parts[1]}%` },
      };
    }

    const allMatches = await User.findAll({
      where: whereClause,
      attributes: { exclude: ['password_hash'] },
      limit: 10,
    });

    // Find who is already at this location so we can flag them
    let alreadyHere = new Set();
    if (currentLocation && UserWorkplace) {
      const existing = await UserWorkplace.findAll({
        where: { locationId: currentLocation },
      });
      existing.forEach(uw => alreadyHere.add(uw.userId));
      // Also check users whose primary work_location is here
      allMatches.forEach(u => {
        if (u.work_location === currentLocation) alreadyHere.add(u.id);
      });
    }

    const results = allMatches.map(u => ({
      user_id:          u.id,
      userId:           u.id,
      fName:            u.fName,
      lName:            u.lName,
      first_name:       u.fName,
      last_name:        u.lName,
      email:            u.email,
      phone_number:     u.phone_number,
      role:             u.role,
      work_location:    u.work_location,
      alreadyAtLocation: alreadyHere.has(u.id),
    }));

    res.send(results);
  } catch (err) {
    console.error("searchByName error:", err);
    res.status(500).send({ message: "Error searching users." });
  }
};

// ── ASSIGN EXISTING USER TO A WORKPLACE (no duplicate user created) ───────
export const assignToWorkplace = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user?.userId || req.user?.id;
    const requestingUser   = await User.findOne({ where: { id: requestingUserId } });

    if (!requestingUser || !['employer', 'admin'].includes(requestingUser.role)) {
      return res.status(403).send({ message: "Only employers can assign employees to workplaces." });
    }

    const targetUser = await User.findOne({ where: { id: userId } });
    if (!targetUser) return res.status(404).send({ message: "User not found." });

    const locationId = requestingUser.work_location;
    if (!locationId) return res.status(400).send({ message: "Employer has no workplace assigned." });

    // Add to UserWorkplace junction table (idempotent)
    const [record, created] = await UserWorkplace.findOrCreate({
      where: { userId: targetUser.id, locationId },
      defaults: { userId: targetUser.id, locationId, createdAt: Date.now() },
    });

    // If user has no primary work_location yet, set it
    if (!targetUser.work_location) {
      await User.update(
        { work_location: locationId, updatedAt: Date.now() },
        { where: { id: targetUser.id } }
      );
    }

    console.log(`User ${targetUser.id} ${created ? 'assigned to' : 'already at'} location ${locationId}`);

    res.send({
      message:  created ? "Employee assigned to your workplace." : "Employee was already at this workplace.",
      alreadyExisted: !created,
      user_id:       targetUser.id,
      userId:        targetUser.id,
      fName:         targetUser.fName,
      lName:         targetUser.lName,
      email:         targetUser.email,
      phone_number:  targetUser.phone_number,
      role:          targetUser.role,
      work_location: targetUser.work_location || locationId,
    });

  } catch (err) {
    console.error("assignToWorkplace error:", err);
    res.status(500).send({ message: "Error assigning employee to workplace." });
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

    let users = [];

    // When an admin is impersonating a workplace the JWT carries role='employer'
    // in the x-user-role header, but the DB record still has role='admin'.
    // req.user.role reflects the JWT claim (employer), while requestingUser.role
    // reflects the DB (admin). We use the JWT claim to decide the view scope,
    // falling back to DB role for straight admin access.
    const effectiveRole      = req.user?.role || requestingUser.role;
    // For impersonation the JWT also carries impersonatedLocation
    const impersonatedLocation = req.user?.impersonatedLocation || null;

    if (effectiveRole === 'employer' || (requestingUser.role === 'admin' && impersonatedLocation)) {
      // Scope to the impersonated location if present, otherwise use work_location
      const locationId = impersonatedLocation || requestingUser.work_location;

      let employeeIds = new Set();

      const directMatches = await User.findAll({
        where: { role: 'employee', work_location: locationId },
        attributes: ['id'],
      });
      directMatches.forEach(u => employeeIds.add(u.id));

      if (UserWorkplace) {
        const jwRecords = await UserWorkplace.findAll({ where: { locationId } });
        jwRecords.forEach(r => employeeIds.add(r.userId));
      }

      if (employeeIds.size === 0) return res.send([]);

      users = await User.findAll({
        where: { id: { [Op.in]: [...employeeIds] }, role: 'employee' },
        attributes: { exclude: ['password_hash'] },
      });

    } else if (requestingUser.role === 'admin') {
      // Plain admin (not impersonating) — return all users, optional role filter
      const roleFilter = req.query.role;
      const condition  = roleFilter ? { role: roleFilter } : {};
      users = await User.findAll({
        where: condition,
        attributes: { exclude: ['password_hash'] },
      });

    } else if (requestingUser.role === 'employee') {
      users = await User.findAll({
        where: { id: requestingUser.id },
        attributes: { exclude: ['password_hash'] },
      });

    } else {
      return res.status(403).send({ message: "Access denied" });
    }

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
    if (req.body.age  !== undefined) updateData.age = req.body.age;
    if (req.body.bio  !== undefined) updateData.bio = req.body.bio;

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

    if (user.role === 'employer' && user.work_location) {
      await q('UPDATE User SET work_location = NULL WHERE work_location = ? AND role = "employee"',
        [user.work_location]);
    }

    await q('DELETE FROM UserWorkplace WHERE user_id = ?',                        [userId]);
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