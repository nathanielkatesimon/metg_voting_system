const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  electionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
  positionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Position', required: true },
  name: { type: String, required: true, trim: true },
  party: { type: String, trim: true, default: '' },
  platform: { type: String, trim: true, default: '' },
  imagePath: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Candidate', candidateSchema);
