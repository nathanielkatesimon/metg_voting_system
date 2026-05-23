const mongoose = require('mongoose');

const positionSchema = new mongoose.Schema({
  electionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
  name: { type: String, required: true, trim: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

positionSchema.index({ electionId: 1, order: 1 });

module.exports = mongoose.model('Position', positionSchema);
