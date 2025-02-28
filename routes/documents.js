const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const { auth, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const Dispute = require('../models/Dispute');

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: './uploads/documents',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Upload document
router.post('/', auth, authorize('organization'), upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF file' });
    }

    const document = new Document({
      pdf: req.file.path,
      complaintId: req.body.complaintId,
      mediatorId: req.body.mediatorId,
      status: 'pending'
    });

    await document.save();
    res.status(201).json(document);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get documents for a specific complaint
router.get('/complaint/:complaintId', auth, async (req, res) => {
  try {
    const documents = await Document.find({ complaintId: req.params.complaintId })
      .populate('mediatorId', 'name email');
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update document status
router.patch('/:id', auth, authorize('mediator', 'admin'), async (req, res) => {
  try {
    const document = await Document.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json(document);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Download document
router.get('/:id/download', auth, authorize('mediator', 'admin', 'arbitrator'), async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.download(document.pdf);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all documents for mediator
router.get('/mediator/all', auth, authorize('mediator'), async (req, res) => {
  try {
    const disputes = await Dispute.find({ mediatorId: req.user._id });
    const disputeIds = disputes.map(dispute => dispute._id);
    
    const documents = await Document.find({ complaintId: { $in: disputeIds } })
      .populate({
        path: 'complaintId',
        populate: {
          path: 'petitionerId respondentId',
          select: 'name email'
        }
      });
    
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 