const mongoose = require('mongoose');

const disputeHistorySchema = new mongoose.Schema({
  disputeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dispute', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  previousData: {
    title: String,
    description: String,
    status: String,
    mediatorId: mongoose.Schema.Types.ObjectId
  },
  newData: {
    title: String,
    description: String,
    status: String,
    mediatorId: mongoose.Schema.Types.ObjectId
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DisputeHistory', disputeHistorySchema); 