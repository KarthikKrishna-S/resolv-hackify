const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Dispute = require('../models/Dispute');
const { auth, authorize } = require('../middleware/auth');

// Get all users
router.get('/users', auth, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user
router.patch('/users/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete user
router.delete('/users/:id', auth, authorize('admin'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all disputes
router.get('/disputes', auth, authorize('admin'), async (req, res) => {
  try {
    const disputes = await Dispute.find({})
      .populate('petitionerId', 'name email')
      .populate('respondentId', 'name email')
      .populate('mediatorId', 'name email');
    res.json(disputes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete dispute
router.delete('/disputes/:id', auth, authorize('admin'), async (req, res) => {
  try {
    await Dispute.findByIdAndDelete(req.params.id);
    res.json({ message: 'Dispute deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 