export default (sequelize, Sequelize) => {
  const UserJobRole = sequelize.define("user_job_role", {
    user_job_role_id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'user_job_role_id'
    },
    userId: {
      type: Sequelize.STRING(255),
      allowNull: false,
      field: 'user_id'
    },
    jobRoleId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      field: 'job_role_id'
    },
    isPrimary: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      field: 'is_primary'
    },
    createdAt: {
      type: Sequelize.BIGINT,
      allowNull: false,
      field: 'created_at'
    }
  }, {
    tableName: 'UserJobRole',
    timestamps: false
  });

  return UserJobRole;
};