export default (sequelize, Sequelize) => {
  const TaskCompletionHistory = sequelize.define("task_completion_history", {
    history_id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'history_id'
    },
    taskListId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      field: 'task_list_id'
    },
    itemId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      field: 'item_id'
    },
    completedBy: {
      type: Sequelize.STRING(255),
      allowNull: false,
      field: 'completed_by'
    },
    completedAt: {
      type: Sequelize.BIGINT,
      allowNull: false,
      field: 'completed_at'
    },
    shiftId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      field: 'shift_id'
    },
    date: {
      type: Sequelize.BIGINT,
      allowNull: false,
      field: 'date'
    },
    notes: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    createdAt: {
      type: Sequelize.BIGINT,
      allowNull: false,
      field: 'created_at'
    }
  }, {
    tableName: 'TaskCompletionHistory',
    timestamps: false
  });
  
  return TaskCompletionHistory;
};