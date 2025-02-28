const express = require('express');
const router = express.Router();
const Dispute = require('../models/Dispute');
const DisputeHistory = require('../models/DisputeHistory');
const { auth, authorize } = require('../middleware/auth');

// Get all elevated disputes
router.get('/disputes', auth, authorize('arbitrator'), async (req, res) => {
  try {
    const disputes = await Dispute.find({ 
      status: 'elevated',
      mediatorId: req.user._id 
    })
    .populate('petitionerId', 'name email')
    .populate('respondentId', 'name email')
    .populate('mediatorId', 'name email');
    
    res.json(disputes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update dispute status and details
router.patch('/disputes/:id', auth, authorize('arbitrator'), async (req, res) => {
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
        status: dispute.status,
        title: dispute.title,
        description: dispute.description
      },
      newData: {
        status: req.body.status || dispute.status,
        title: req.body.title || dispute.title,
        description: req.body.description || dispute.description
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

module.exports = router; 