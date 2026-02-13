import Skill from "../models/skill.model.js";

// Create a new Skill
export const create = async (req, res) => {
  try {
    if (!req.body.name) {
      return res.status(400).send({ message: "Skill name is required!" });
    }

    const skill = await Skill.create({
      name: req.body.name,
      description: req.body.description || null,
      createdAt: Date.now(),
    });

    res.status(201).send(skill);
  } catch (err) {
    console.error("Error creating skill:", err.message);
    res.status(500).send({ message: err.message || "Error creating skill." });
  }
};

// Retrieve all Skills
export const findAll = async (req, res) => {
  try {
    const skills = await Skill.findAll();
    res.send(skills);
  } catch (err) {
    console.error("Error retrieving skills:", err);
    res.status(500).send({ message: "Error retrieving skills." });
  }
};

// Find one Skill by ID
export const findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const skill = await Skill.findByPk(id);
    if (!skill)
      return res.status(404).send({ message: `Skill not found with id=${id}` });
    res.send(skill);
  } catch (err) {
    console.error("Error retrieving skill:", err);
    res.status(500).send({ message: "Error retrieving skill." });
  }
};

// Update a Skill
export const update = async (req, res) => {
  try {
    const id = req.params.id;
    const [updated] = await Skill.update(req.body, { where: { id } });
    if (updated === 1)
      res.send({ message: "Skill updated successfully." });
    else
      res.status(404).send({ message: "Skill not found or no data changed." });
  } catch (err) {
    console.error("Error updating skill:", err);
    res.status(500).send({ message: "Error updating skill." });
  }
};

// Delete a Skill
export const remove = async (req, res) => {
  try {
    const id = req.params.id;
    // Remove all user associations first
    await UserSkill.destroy({ where: { skillId: id } });
    const deleted = await Skill.destroy({ where: { id } });
    if (deleted)
      res.send({ message: "Skill deleted successfully." });
    else
      res.status(404).send({ message: "Skill not found." });
  } catch (err) {
    console.error("Error deleting skill:", err);
    res.status(500).send({ message: err.message || "Error deleting skill." });
  }
};

// Add a Skill to a User
export const addSkillToUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { skillId } = req.body;

    if (!skillId) {
      return res.status(400).send({ message: "skillId is required!" });
    }

    // Check if already assigned
    const existing = await UserSkill.findOne({ where: { userId, skillId } });
    if (existing) {
      return res.status(400).send({ message: "User already has this skill." });
    }

    const userSkill = await UserSkill.create({
      userId,
      skillId,
      createdAt: Date.now(),
    });

    res.status(201).send(userSkill);
  } catch (err) {
    console.error("Error adding skill to user:", err.message);
    res.status(500).send({ message: err.message || "Error adding skill to user." });
  }
};

// Get all Skills for a User
export const findByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const userSkills = await UserSkill.findAll({ where: { userId } });

    // Get full skill details
    const skillIds = userSkills.map((us) => us.skillId);
    const skills = await Skill.findAll({ where: { id: skillIds } });

    res.send(skills);
  } catch (err) {
    console.error("Error retrieving user skills:", err);
    res.status(500).send({ message: "Error retrieving user skills." });
  }
};

// Remove a Skill from a User
export const removeSkillFromUser = async (req, res) => {
  try {
    const { userId, skillId } = req.params;
    const deleted = await UserSkill.destroy({ where: { userId, skillId } });
    if (deleted)
      res.send({ message: "Skill removed from user." });
    else
      res.status(404).send({ message: "User skill assignment not found." });
  } catch (err) {
    console.error("Error removing skill from user:", err);
    res.status(500).send({ message: err.message || "Error removing skill from user." });
  }
};