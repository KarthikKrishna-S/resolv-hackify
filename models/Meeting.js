const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  disputeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dispute', required: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mediatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  proposedDateTime: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected', 'completed'], 
    default: 'pending' 
  },
  meetingLink: { type: String },
  notes: { type: String },
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Meeting', meetingSchema); 