import db from "../models/index.js";

const User          = db.user;
const UserWorkplace = db.userWorkplace;
const BusinessArea  = db.businessArea;
const { Op }        = db.Sequelize;

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
      if (role === 'employee' || existingUser.role === 'employee') {
        const reqUser    = await User.findOne({ where: { id: req.user?.userId || req.user?.id } });
        const locationId = req.user?.impersonatedLocation || reqUser?.work_location;

        if (locationId) {
          try {
            await UserWorkplace.findOrCreate({
              where:    { userId: existingUser.id, locationId },
              defaults: { userId: existingUser.id, locationId, isActive: 1, createdAt: Date.now() },
            });
            await UserWorkplace.update(
              { isActive: 1, terminated_at: null },
              { where: { userId: existingUser.id, locationId } }
            );
            if (!existingUser.work_location) {
              await User.update(
                { work_location: locationId, updatedAt: Date.now() },
                { where: { id: existingUser.id } }
              );
            }
          } catch (e) { console.warn("Auto-assign skipped:", e.message); }

          return res.status(200).send({
            message:        "User already exists — assigned to your workplace.",
            alreadyExisted: true,
            user_id:        existingUser.id,
            userId:         existingUser.id,
            first_name:     existingUser.fName,
            last_name:      existingUser.lName,
            fName:          existingUser.fName,
            lName:          existingUser.lName,
            email:          existingUser.email,
            phone_number:   existingUser.phone_number,
            role:           existingUser.role,
            work_location:  existingUser.work_location || locationId,
          });
        }
      }
      return res.status(400).send({ message: "Email already exists" });
    }

    let finalWorkLocation = workLocation;
    if (role === 'employee' && !workLocation && req.user) {
      const requestingUser  = await User.findOne({ where: { id: req.user.userId || req.user.id } });
      finalWorkLocation     = req.user?.impersonatedLocation || requestingUser?.work_location || null;
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

    if (finalWorkLocation) {
      try {
        await UserWorkplace.findOrCreate({
          where:    { userId: user.id, locationId: finalWorkLocation },
          defaults: { userId: user.id, locationId: finalWorkLocation, isActive: 1, createdAt: Date.now() },
        });
      } catch (e) { console.warn("UserWorkplace create skipped:", e.message); }
    }

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

// ── SEARCH USERS BY NAME ──────────────────────────────────────────────────
export const searchByName = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).send({ message: "Query must be at least 2 characters" });
    }

    const requestingUserId = req.user?.userId || req.user?.id;
    const requestingUser   = await User.findOne({ where: { id: requestingUserId } });
    if (!requestingUser) return res.status(401).send({ message: "Unauthorized" });

    const currentLocation = req.user?.impersonatedLocation || requestingUser.work_location;

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
      whereClause = {
        role:  'employee',
        fName: { [Op.like]: `%${parts[0]}%` },
        lName: { [Op.like]: `%${parts[1]}%` },
      };
    }

    const allMatches = await User.findAll({
      where:      whereClause,
      attributes: { exclude: ['password_hash'] },
      limit:      10,
    });

    let alreadyHere = new Set();
    if (currentLocation && UserWorkplace) {
      const existing = await UserWorkplace.findAll({
        where: { locationId: currentLocation, isActive: 1 },
      });
      existing.forEach(uw => alreadyHere.add(uw.userId));

      // Also mark users whose work_location matches (seeded without UserWorkplace rows)
      allMatches.forEach(u => {
        if (String(u.work_location) === String(currentLocation)) alreadyHere.add(u.id);
      });
    }

    res.send(allMatches.map(u => ({
      user_id:           u.id,
      userId:            u.id,
      fName:             u.fName,
      lName:             u.lName,
      first_name:        u.fName,
      last_name:         u.lName,
      email:             u.email,
      phone_number:      u.phone_number,
      role:              u.role,
      work_location:     u.work_location,
      alreadyAtLocation: alreadyHere.has(u.id),
    })));

  } catch (err) {
    console.error("searchByName error:", err);
    res.status(500).send({ message: "Error searching users." });
  }
};

// ── ASSIGN EXISTING USER TO A WORKPLACE ───────────────────────────────────
export const assignToWorkplace = async (req, res) => {
  try {
    const { userId }       = req.params;
    const requestingUserId = req.user?.userId || req.user?.id;
    const requestingUser   = await User.findOne({ where: { id: requestingUserId } });

    const callerRole = req.user?.role || requestingUser?.role;
    if (!requestingUser || !['employer', 'admin'].includes(callerRole)) {
      return res.status(403).send({ message: "Only employers can assign employees to workplaces." });
    }

    const targetUser = await User.findOne({ where: { id: userId } });
    if (!targetUser) return res.status(404).send({ message: "User not found." });

    const locationId = req.user?.impersonatedLocation || requestingUser.work_location;
    if (!locationId) return res.status(400).send({ message: "Employer has no workplace assigned." });

    const [record, created] = await UserWorkplace.findOrCreate({
      where:    { userId: targetUser.id, locationId },
      defaults: { userId: targetUser.id, locationId, isActive: 1, createdAt: Date.now() },
    });

    if (!created && record.isActive === 0) {
      await UserWorkplace.update(
        { isActive: 1, terminated_at: null },
        { where: { userId: targetUser.id, locationId } }
      );
    }

    if (!targetUser.work_location) {
      await User.update(
        { work_location: locationId, updatedAt: Date.now() },
        { where: { id: targetUser.id } }
      );
    }

    res.send({
      message:        created ? "Employee assigned to your workplace." : "Employee was already at this workplace.",
      alreadyExisted: !created,
      user_id:        targetUser.id,
      userId:         targetUser.id,
      fName:          targetUser.fName,
      lName:          targetUser.lName,
      email:          targetUser.email,
      phone_number:   targetUser.phone_number,
      role:           targetUser.role,
      work_location:  targetUser.work_location || locationId,
    });

  } catch (err) {
    console.error("assignToWorkplace error:", err);
    res.status(500).send({ message: "Error assigning employee to workplace." });
  }
};

export const removeFromWorkplace = async (req, res) => {
  try {
    const { userId }       = req.params;
    const requestingUserId = req.user?.userId || req.user?.id;
    const requestingUser   = await User.findOne({ where: { id: requestingUserId } });

    const callerRole = req.user?.role || requestingUser?.role;
    if (!requestingUser || !['employer', 'admin'].includes(callerRole)) {
      return res.status(403).send({ message: "Only employers can remove employees from workplaces." });
    }

    const locationId = req.user?.impersonatedLocation || requestingUser.work_location;
    if (!locationId) return res.status(400).send({ message: "Employer has no workplace assigned." });

    const [updated] = await UserWorkplace.update(
      { isActive: 0, terminated_at: Date.now() },
      { where: { userId, locationId } }
    );

    if (updated === 0) {
      return res.status(404).send({ message: "Employee not found at this workplace." });
    }

    const targetUser = await User.findOne({ where: { id: userId } });
    if (targetUser && String(targetUser.work_location) === String(locationId)) {
      const remaining = await UserWorkplace.findAll({
        where: { userId, isActive: 1 },
      });
      const newPrimary = remaining.length > 0 ? remaining[0].locationId : null;
      await User.update(
        { work_location: newPrimary, updatedAt: Date.now() },
        { where: { id: userId } }
      );
    }

    res.send({
      message: "Employee removed from your workplace. Their account and other workplace records are intact.",
      userId,
      locationId,
    });

  } catch (err) {
    console.error("removeFromWorkplace error:", err);
    res.status(500).send({ message: "Error removing employee from workplace." });
  }
};


export const findAll = async (req, res) => {
  try {
    const requestingUserId = req.user?.userId || req.user?.id;
    if (!requestingUserId) return res.status(401).send({ message: "Unauthorized" });

    const requestingUser = await User.findOne({
      where:      { id: requestingUserId },
      attributes: { exclude: ['password_hash'] },
    });
    if (!requestingUser) return res.status(404).send({ message: "User not found" });

    const effectiveRole        = req.user?.role || requestingUser.role;
    const impersonatedLocation = req.user?.impersonatedLocation || null;

    let users = [];

    if (effectiveRole === 'employer' || (requestingUser.role === 'admin' && impersonatedLocation)) {
      const locationId = impersonatedLocation || requestingUser.work_location;

      if (!locationId) return res.send([]);

      // ── Step 1: Get IDs from UserWorkplace (active rows only) ──────────
      const activeRecords = await UserWorkplace.findAll({
        where: { locationId, isActive: 1 },
      });
      const activeViaWorkplaceTable = new Set(activeRecords.map(r => r.userId));

      
      const terminatedRecords = await UserWorkplace.findAll({
        where: { locationId, isActive: 0 },
      });
      const terminatedIds = new Set(terminatedRecords.map(r => r.userId));

      const legacyUsers = await User.findAll({
        where: {
          role:          'employee',
          work_location: locationId,
        },
        attributes: { exclude: ['password_hash'] },
      });
      const legacyIds = legacyUsers
        .map(u => u.id)
        .filter(id => !activeViaWorkplaceTable.has(id) && !terminatedIds.has(id));

      // ── Step 4: Backfill UserWorkplace rows for legacy/seeded users ────
      // This repairs the data so future queries work correctly
      for (const legacyId of legacyIds) {
        try {
          await UserWorkplace.findOrCreate({
            where:    { userId: legacyId, locationId },
            defaults: { userId: legacyId, locationId, isActive: 1, createdAt: Date.now() },
          });
        } catch (e) { /* skip if already exists */ }
      }

      // ── Step 5: Combine all valid IDs ─────────────────────────────────
      const allValidIds = [
        ...activeViaWorkplaceTable,
        ...legacyIds,
      ].filter(id => !terminatedIds.has(id));

      if (allValidIds.length === 0) return res.send([]);

      users = await User.findAll({
        where:      { id: { [Op.in]: allValidIds }, role: 'employee' },
        attributes: { exclude: ['password_hash'] },
      });

    } else if (requestingUser.role === 'admin') {
      const roleFilter = req.query.role;
      const condition  = roleFilter ? { role: roleFilter } : {};
      users = await User.findAll({
        where:      condition,
        attributes: { exclude: ['password_hash'] },
      });

    } else if (requestingUser.role === 'employee') {
      users = await User.findAll({
        where:      { id: requestingUser.id },
        attributes: { exclude: ['password_hash'] },
      });

    } else {
      return res.status(403).send({ message: "Access denied" });
    }

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

export const findOne = async (req, res) => {
  try {
    const user = await User.findOne({
      where:      { id: req.params.id },
      attributes: { exclude: ['password_hash'] },
    });
    if (!user) return res.status(404).send({ message: `User not found with id=${req.params.id}` });

    res.send({
      user_id:        user.id,
      userId:         user.id,
      first_name:     user.fName,
      last_name:      user.lName,
      fName:          user.fName,
      lName:          user.lName,
      email:          user.email,
      phone_number:   user.phone_number,
      role:           user.role,
      work_location:  user.work_location,
      age:            user.age,
      bio:            user.bio,
      certifications: user.certifications || [],
      created_at:     user.createdAt,
      updated_at:     user.updatedAt,
    });
  } catch (err) {
    res.status(500).send({ message: "Error retrieving user." });
  }
};

// ── UPDATE CERTIFICATIONS ─────────────────────────────────────────────────
export const updateCertifications = async (req, res) => {
  try {
    const { certifications } = req.body;
    await User.update(
      { certifications: certifications || [] },
      { where: { id: req.params.id } }
    );
    res.send({ message: 'Certifications updated.' });
  } catch (err) {
    res.status(500).send({ message: 'Error updating certifications.' });
  }
};

export const findByEmail = async (req, res) => {
  try {
    const user = await User.findOne({
      where:      { email: req.params.email },
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
    res.status(500).send({ message: "Error retrieving user." });
  }
};

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
    if (req.body.age !== undefined) updateData.age = req.body.age;
    if (req.body.bio !== undefined) updateData.bio = req.body.bio;

    updateData.updatedAt = Date.now();

    const [updated] = await User.update(updateData, { where: { id: userId } });
    if (updated !== 1) return res.status(404).send({ message: "User not found or no data changed." });

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
    res.status(500).send({ message: "Error updating user." });
  }
};

export const remove = async (req, res) => {
  const userId = req.params.id;

  const callerRole = req.user?.role || req.user?.actualRole;
  if (callerRole !== 'admin') {
    return res.status(403).send({
      message: "Hard delete is restricted to admins. Use 'Remove from Workplace' to remove an employee from your location.",
    });
  }

  const user = await User.findOne({ where: { id: userId } });
  if (!user) return res.status(404).send({ message: "User not found" });

  const transaction = await db.sequelize.transaction();
  try {
    const q = (sql, replacements) =>
      db.sequelize.query(sql, { replacements, transaction }).catch(e => console.warn(e.message));

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

    res.send({ message: "User permanently deleted.", userId });
  } catch (err) {
    await transaction.rollback();
    res.status(500).send({ message: "Error deleting user.", error: err.message });
  }
};