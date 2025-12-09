const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Room = sequelize.define('Room', {
  roomNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  capacity: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  occupancy: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true,
  tableName: 'rooms'
});

module.exports = Room;
