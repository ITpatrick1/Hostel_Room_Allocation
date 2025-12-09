const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Room = require('../models/Room');
const Allocation = require('../models/Allocation');

// Register student
router.post('/', async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.json(student);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Allocate room
router.post('/allocate', async (req, res) => {
  const { studentId, roomId } = req.body;
  try {
    if (!studentId || !roomId) {
      return res.status(400).json({ error: 'studentId and roomId required' });
    }

    const room = await Room.findByPk(roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.occupancy >= room.capacity) {
      return res.status(400).json({ error: 'Room full' });
    }

    await Allocation.create({ studentId, roomId });
    room.occupancy += 1;
    await room.save();

    res.json({ message: 'Room allocated successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get student allocations
router.get('/allocations', async (_req, res) => {
  try {
    const allocations = await Allocation.findAll({
      include: [
        { model: Student },
        { model: Room }
      ]
    });
    res.json(allocations);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
