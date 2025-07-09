const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// JWT middleware
function auth(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
}

// Get all attendance (admin/teacher)
router.get('/', auth, async (req, res) => {
  if (req.user.role === 'student') return res.status(403).json({ msg: 'Access denied' });
  const records = await Attendance.find().populate('user', 'name email role');
  res.json(records);
});

// Get own attendance (student)
router.get('/me', auth, async (req, res) => {
  const records = await Attendance.find({ user: req.user.id }).populate('user', 'name email role');
  res.json(records);
});

// Create attendance (admin/teacher)
router.post('/', auth, async (req, res) => {
  if (!['admin', 'teacher'].includes(req.user.role)) return res.status(403).json({ msg: 'Access denied' });
  const { user, date, status, notes } = req.body;
  const record = new Attendance({ user, date, status, notes });
  await record.save();
  res.json(record);
});

// Update attendance (admin/teacher)
router.put('/:id', auth, async (req, res) => {
  if (!['admin', 'teacher'].includes(req.user.role)) return res.status(403).json({ msg: 'Access denied' });
  const { status, notes } = req.body;
  const record = await Attendance.findByIdAndUpdate(req.params.id, { status, notes }, { new: true });
  res.json(record);
});

// Delete attendance (admin/teacher)
router.delete('/:id', auth, async (req, res) => {
  if (!['admin', 'teacher'].includes(req.user.role)) return res.status(403).json({ msg: 'Access denied' });
  await Attendance.findByIdAndDelete(req.params.id);
  res.json({ msg: 'Attendance record deleted' });
});

module.exports = router; 