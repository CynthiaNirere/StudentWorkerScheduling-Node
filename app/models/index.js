import User from "./user.model.js";
import Session from "./session.model.js";
import sequelize from "../config/sequelizeInstance.js";
import { Sequelize } from "sequelize";

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Models
db.user = User;
db.session = Session;

// ========================================
// User Associations
// ========================================

// User <-> AthleteProfile (One-to-One)
User.hasOne(AthleteProfile, {
  foreignKey: 'athleteId',  
  as: 'athleteProfile'
});
AthleteProfile.belongsTo(User, {
  foreignKey: 'athleteId',  
  as: 'user'
});

// User <-> Coach (One-to-One)
User.hasOne(Coach, {
  foreignKey: 'coachId',  
  as: 'coachProfile'
});
Coach.belongsTo(User, {
  foreignKey: 'coachId',  
  as: 'user'
});

// User <-> Goal (One-to-Many) - Athlete's goals
User.hasMany(Goal, {
  foreignKey: 'athleteId',  
  as: 'goals'
});
Goal.belongsTo(User, {
  foreignKey: 'athleteId',  
  as: 'athlete'
});

// ========================================
// NEW: Goal Creator Associations
// ========================================

// User <-> Goal (One-to-Many) - Goals created by user (coach or athlete)
User.hasMany(Goal, {
  foreignKey: 'createdBy',
  as: 'createdGoals'
});
Goal.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator'
});

// Exercise <-> Goal (One-to-Many) - Goals linked to exercises
Exercise.hasMany(Goal, {
  foreignKey: 'exerciseId',
  as: 'goals'
});
Goal.belongsTo(Exercise, {
  foreignKey: 'exerciseId',
  as: 'exercise'
});

// ExercisePlan <-> Goal (One-to-Many) - Goals linked to plans
ExercisePlan.hasMany(Goal, {
  foreignKey: 'planId',
  as: 'goals'
});
Goal.belongsTo(ExercisePlan, {
  foreignKey: 'planId',
  as: 'plan'
});

// ========================================
// Exercise Result Associations
// ========================================

// User <-> ExerciseResult (One-to-Many)
User.hasMany(ExerciseResult, {
  foreignKey: 'athleteId',  
  as: 'exerciseResults'
});
ExerciseResult.belongsTo(User, {
  foreignKey: 'athleteId',  
  as: 'athlete'
});

// Exercise <-> ExerciseResult (One-to-Many)
Exercise.hasMany(ExerciseResult, {
  foreignKey: 'exerciseId',  
  as: 'results'
});
ExerciseResult.belongsTo(Exercise, {
  foreignKey: 'exerciseId',  
  as: 'exercise'
});

// ========================================
// NEW: Exercise Result Goal Tracking
// ========================================

// Goal <-> ExerciseResult (One-to-Many) - Results linked to goals
Goal.hasMany(ExerciseResult, {
  foreignKey: 'goalId',
  as: 'results'
});
ExerciseResult.belongsTo(Goal, {
  foreignKey: 'goalId',
  as: 'goal'
});

// AthletePlan <-> ExerciseResult (One-to-Many) - Results linked to assigned plans
AthletePlan.hasMany(ExerciseResult, {
  foreignKey: 'athletePlanId',
  as: 'results'
});
ExerciseResult.belongsTo(AthletePlan, {
  foreignKey: 'athletePlanId',
  as: 'athletePlan'
});

// ========================================
// Exercise Plan Associations
// ========================================

// ExercisePlan <-> Exercise (Many-to-Many through ExercisePlanItem)
ExercisePlan.belongsToMany(Exercise, {
  through: ExercisePlanItem,
  foreignKey: 'planId',  
  otherKey: 'exerciseId',  
  as: 'exercises'
});
Exercise.belongsToMany(ExercisePlan, {
  through: ExercisePlanItem,
  foreignKey: 'exerciseId',  
  otherKey: 'planId',  
  as: 'plans'
});

// ========================================
// Athlete Plan Associations
// ========================================

// AthletePlan <-> User (athlete)
AthletePlan.belongsTo(User, {
  foreignKey: 'athleteId',
  as: 'athlete'
});
User.hasMany(AthletePlan, {
  foreignKey: 'athleteId',
  as: 'assignedPlans'
});



export default db;