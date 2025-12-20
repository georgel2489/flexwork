module.exports = (sequelize, DataTypes) => {
  const OfficialHoliday = sequelize.define('OfficialHoliday', {
    holiday_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      index: true,
    },
    holiday_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      unique: true,
      index: true,
    },
    holiday_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      onUpdate: DataTypes.NOW,
    },
  }, {
    timestamps: false,
    tableName: 'official_holidays',
  });

  return OfficialHoliday;
};
