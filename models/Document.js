const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  pdf: { type: String, required: true }, // Store PDF file path or URL
  complaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dispute', required: true },
  mediatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Document', documentSchema); 