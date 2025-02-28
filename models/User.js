const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String},
  email: { type: String},
  googleId: { type: String},
  profilePicture: { type: String },
  role: { 
    type: String, 
    enum: ['individual', 'organization', 'mediator', 'admin', 'arbitrator'], 
    required: true 
  },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  zip: { type: String },
  country: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema); 