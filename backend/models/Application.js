const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  company:             { type: String, required: true },
  jobTitle:            { type: String, required: true },
  location:            { type: String, default: '' },
  applicationLink:     { type: String, default: '' },
  date:                { type: String, default: '' },
  status:              { type: String, enum: ['applied', 'interview', 'approved', 'rejected'], default: 'applied' },
  offerLetterReceived: { type: Boolean, default: false },
  user:                { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resume: {
    data:        { type: Buffer },
    contentType: { type: String },
    filename:    { type: String },
  },
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
