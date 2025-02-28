const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  petitionerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  respondentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mediatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'in-progress', 'resolved', 'cancelled'], default: 'pending' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Dispute', disputeSchema); 