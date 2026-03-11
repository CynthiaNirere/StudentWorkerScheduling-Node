export default (sequelize, Sequelize) => {
  const ShiftTask = sequelize.define("shift_task", {
    shift_task_id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'shift_task_id'
    },
    shiftId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      field: 'shift_id'
    },
    tasklistId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      field: 'tasklist_id'
    },
    createdAt: {
      type: Sequelize.BIGINT,
      allowNull: false,
      field: 'created_at'
    }
  }, {
    tableName: 'ShiftTask',
    timestamps: false
  });

  return ShiftTask;
};