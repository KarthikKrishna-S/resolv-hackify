const express = require('express');
const router = express.Router();
const Dispute = require('../models/Dispute');
const DisputeHistory = require('../models/DisputeHistory');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Create new dispute
router.post('/', auth, authorize('individual', 'organization'), async (req, res) => {
  try {
    const dispute = new Dispute({
      ...req.body,
      petitionerId: req.user._id,
      status: 'pending'
    });
    await dispute.save();
    res.status(201).json(dispute);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all disputes (with filters)
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    // Filter based on user role
    if (req.user.role === 'individual' || req.user.role === 'organization') {
      query.$or = [
        { petitionerId: req.user._id },
        { respondentId: req.user._id }
      ];
    } else if (req.user.role === 'mediator') {
      query.mediatorId = req.user._id;
    }

    const disputes = await Dispute.find(query)
      .populate('petitionerId', 'name email')
      .populate('respondentId', 'name email')
      .populate('mediatorId', 'name email');
    
    res.json(disputes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update dispute status
router.patch('/:id', auth, authorize('mediator', 'admin'), async (req, res) => {
  try {
    const dispute = await Dispute.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true }
    );
    res.json(dispute);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Create dispute by mediator
router.post('/mediator-create', auth, authorize('mediator'), async (req, res) => {
  try {
    const { title, description, petitionerEmail, respondentEmail } = req.body;

    // Find or invite petitioner
    let petitioner = await User.findOne({ email: petitionerEmail });
    if (!petitioner) {
      return res.status(404).json({ message: 'Petitioner not found' });
    }

    // Find or invite respondent
    let respondent = await User.findOne({ email: respondentEmail });
    if (!respondent) {
      // Generate temporary password
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Create new user account for respondent
      respondent = new User({
        email: respondentEmail,
        password: hashedPassword,
        role: 'individual',
        name: 'Pending Registration'
      });
      await respondent.save();

      // Send invitation email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: respondentEmail,
        subject: 'Invitation to Dispute Resolution Platform',
        html: `
          <h1>You have been invited to join a dispute resolution case</h1>
          <p>Temporary login credentials:</p>
          <p>Email: ${respondentEmail}</p>
          <p>Password: ${tempPassword}</p>
          <p>Please login and update your profile information.</p>
        `
      };

      await transporter.sendMail(mailOptions);
    }

    const dispute = new Dispute({
      title,
      description,
      petitionerId: petitioner._id,
      respondentId: respondent._id,
      mediatorId: req.user._id,
      status: 'pending'
    });

    await dispute.save();
    res.status(201).json(dispute);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update dispute details with history
router.patch('/:id/details', auth, authorize('mediator'), async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    // Create history record
    const history = new DisputeHistory({
      disputeId: dispute._id,
      updatedBy: req.user._id,
      previousData: {
        title: dispute.title,
        description: dispute.description,
        status: dispute.status,
        mediatorId: dispute.mediatorId
      },
      newData: {
        title: req.body.title || dispute.title,
        description: req.body.description || dispute.description,
        status: req.body.status || dispute.status,
        mediatorId: req.body.mediatorId || dispute.mediatorId
      }
    });
    await history.save();

    // Update dispute
    Object.assign(dispute, req.body);
    await dispute.save();

    res.json(dispute);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Elevate dispute to arbitrator
router.patch('/:id/elevate', auth, authorize('mediator'), async (req, res) => {
  try {
    const { arbitratorId } = req.body;
    const dispute = await Dispute.findById(req.params.id);
    
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    // Create history record
    const history = new DisputeHistory({
      disputeId: dispute._id,
      updatedBy: req.user._id,
      previousData: {
        status: dispute.status,
        mediatorId: dispute.mediatorId
      },
      newData: {
        status: 'elevated',
        mediatorId: arbitratorId
      }
    });
    await history.save();

    // Update dispute
    dispute.status = 'elevated';
    dispute.mediatorId = arbitratorId;
    await dispute.save();

    res.json(dispute);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get dispute history
router.get('/:id/history', auth, async (req, res) => {
  try {
    const history = await DisputeHistory.find({ disputeId: req.params.id })
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 