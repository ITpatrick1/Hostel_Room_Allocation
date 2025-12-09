const { DataTypes } = require('sequelize');
const sequelize = require('./index');
const Student = require('./Student');
const Room = require('./Room');

const Allocation = sequelize.define('Allocation', {
  studentId: {
    type: DataTypes.INTEGER,
    references: {
      model: Student,
      key: 'id'
    }
  },
  roomId: {
    type: DataTypes.INTEGER,
    references: {
      model: Room,
      key: 'id'
    }
  }
}, {
  timestamps: true,
  tableName: 'allocations'
});

// Associations
Student.hasOne(Allocation, { foreignKey: 'studentId' });
Room.hasMany(Allocation, { foreignKey: 'roomId' });
Allocation.belongsTo(Student, { foreignKey: 'studentId' });
Allocation.belongsTo(Room, { foreignKey: 'roomId' });

module.exports = Allocation;
