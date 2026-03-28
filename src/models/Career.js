const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Career', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('TSU', 'Ingeniería', 'Licenciatura'),
      allowNull: false,
      defaultValue: 'TSU'
    }
  }, {
    tableName: 'careers',
    timestamps: true
  });
};
