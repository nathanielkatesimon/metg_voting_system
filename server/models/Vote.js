const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  electionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
  positionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Position', required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  voterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp: { type: Date, default: Date.now },
});

voteSchema.index({ electionId: 1, positionId: 1, voterId: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema);
