const express = require('express');
const router = express.Router();
const Meeting = require('../models/Meeting');
const { auth, authorize } = require('../middleware/auth');
const nodemailer = require('nodemailer');

// Configure nodemailer (use the same configuration as before)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Request a meeting
router.post('/', auth, authorize('individual', 'organization'), async (req, res) => {
  try {
    const meeting = new Meeting({
      disputeId: req.body.disputeId,
      requestedBy: req.user._id,
      mediatorId: req.body.mediatorId,
      proposedDateTime: new Date(req.body.proposedDateTime),
      attendees: [req.user._id, req.body.mediatorId]
    });

    await meeting.save();

    // Send email notification to mediator
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: req.body.mediatorEmail,
      subject: 'New Meeting Request',
      html: `
        <h1>New Meeting Request</h1>
        <p>A meeting has been requested for dispute ${req.body.disputeId}</p>
        <p>Proposed Date and Time: ${req.body.proposedDateTime}</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json(meeting);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get meetings (for mediator or individual)
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'mediator') {
      query.mediatorId = req.user._id;
    } else {
      query.attendees = req.user._id;
    }

    const meetings = await Meeting.find(query)
      .populate('disputeId')
      .populate('requestedBy', 'name email')
      .populate('mediatorId', 'name email')
      .sort({ proposedDateTime: 1 });

    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update meeting status (mediator only)
router.patch('/:id', auth, authorize('mediator'), async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    meeting.status = req.body.status;
    if (req.body.meetingLink) {
      meeting.meetingLink = req.body.meetingLink;
    }
    if (req.body.notes) {
      meeting.notes = req.body.notes;
    }

    await meeting.save();

    // Send email notification to all attendees
    const attendees = await User.find({ _id: { $in: meeting.attendees } });
    for (const attendee of attendees) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: attendee.email,
        subject: `Meeting ${meeting.status}`,
        html: `
          <h1>Meeting Update</h1>
          <p>The meeting status has been updated to: ${meeting.status}</p>
          ${meeting.meetingLink ? `<p>Meeting Link: ${meeting.meetingLink}</p>` : ''}
          <p>Date and Time: ${meeting.proposedDateTime}</p>
        `
      };

      await transporter.sendMail(mailOptions);
    }

    res.json(meeting);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 