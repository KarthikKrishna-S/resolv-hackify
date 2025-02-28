const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Middleware for parsing JSON bodies
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/dispute-resolution', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Import routes
const authRoutes = require('./routes/auth');
const disputeRoutes = require('./routes/disputes');
const userRoutes = require('./routes/users');
const documentRoutes = require('./routes/documents');
const arbitratorRoutes = require('./routes/arbitrator');
const adminRoutes = require('./routes/admin');
const meetingRoutes = require('./routes/meetings');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/arbitrator', arbitratorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/meetings', meetingRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

