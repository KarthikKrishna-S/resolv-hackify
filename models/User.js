const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['individual', 'organization', 'mediator', 'admin', 'arbitrator'], 
    required: true 
  },
  profilePicture: { type: String },
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