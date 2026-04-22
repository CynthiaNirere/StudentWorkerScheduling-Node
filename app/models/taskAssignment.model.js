export default (sequelize, Sequelize) => {
  const TaskAssignment = sequelize.define("TaskAssignment", {
    assignment_id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tasklist_id:   { type: Sequelize.INTEGER,    allowNull: false },
    employee_id:   { type: Sequelize.STRING,     allowNull: false },
    shift_id:      { type: Sequelize.INTEGER },
    assigned_date: { type: Sequelize.BIGINT,     allowNull: false },
    assigned_by:   { type: Sequelize.STRING },
    status:        { type: Sequelize.STRING,     defaultValue: 'active' },
    created_at:    { type: Sequelize.BIGINT,     allowNull: false },
    updated_at:    { type: Sequelize.BIGINT },
  }, {
    tableName: "TaskAssignment",
    timestamps: false,
  });
  return TaskAssignment;
};
