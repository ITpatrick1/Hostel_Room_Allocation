const express = require('express');
const router = express.Router();
const Room = require('../models/Room');

// Create room
router.post('/rooms', async (req, res) => {
  try {
    if (!req.body.roomNumber || !req.body.capacity) {
      return res.status(400).json({ error: 'roomNumber and capacity required' });
    }

    const room = await Room.create(req.body);
    res.json(room);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all rooms
router.get('/rooms', async (_req, res) => {
  try {
    const rooms = await Room.findAll();
    res.json(rooms);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
