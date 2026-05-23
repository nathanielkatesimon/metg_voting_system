const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  electionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
  positionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Position', required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  voterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp: { type: Date, default: Date.now },
});

// Unique per voter+candidate combination; multiple candidates per position are allowed up to position.seats
voteSchema.index({ electionId: 1, positionId: 1, voterId: 1, candidateId: 1 }, { unique: true });

const Vote = mongoose.model('Vote', voteSchema);

// Drop the old 3-field unique index that prevented more than one vote per position.
// Mongoose only creates indexes declared in the schema — it never drops removed ones.
mongoose.connection.on('connected', () => {
  Vote.collection.dropIndex('electionId_1_positionId_1_voterId_1').catch(() => {});
});

module.exports = Vote;
